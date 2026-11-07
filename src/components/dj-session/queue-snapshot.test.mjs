import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as sessionState from "./session-state.ts";

const source = readFileSync(new URL("./index.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
    },
});

const loadQueueReader = (spicetify) => {
    const exports = {};
    vm.runInNewContext(outputText, {
        exports,
        Spicetify: spicetify,
        require: (name) => {
            if (name === "react") return { createContext: () => ({}) };
            if (name === "react/jsx-runtime") return {};
            if (name === "./session-state") return sessionState;
            if (name === "@/api/track-info") {
                return {
                    getCachedTrackInfo: () => undefined,
                    getTrackId: () => undefined,
                    getTrackInfos: async () => new Map(),
                };
            }
            throw new Error(`Unexpected import: ${name}`);
        },
    });
    return exports.getQeueueTracks;
};

const track = (uid, provider = "queue") => ({
    provider,
    contextTrack: { uid, uri: `spotify:track:${uid}` },
});

test("player item wins over a stale queue current track", () => {
    const previous = track("previous");
    const current = track("current");
    const upcoming = track("upcoming");
    const read = loadQueueReader({
        Player: { data: { item: current.contextTrack } },
        Queue: { track: previous, nextTracks: [current, upcoming] },
    });
    assert.equal(
        read()
            .map((row) => row.uid)
            .join(","),
        "current,upcoming",
    );
});

test("only explicitly queued upcoming songs are included", () => {
    const current = track("current");
    const read = loadQueueReader({
        Player: { data: { item: current.contextTrack } },
        Queue: {
            track: current,
            nextTracks: [track("context", "context"), track("queued")],
        },
    });
    assert.equal(
        read()
            .map((row) => row.uid)
            .join(","),
        "current,queued",
    );
});

test("queue state is a fallback while player data initializes", () => {
    const read = loadQueueReader({
        Player: {},
        Queue: { track: track("current"), nextTracks: [] },
    });
    assert.equal(read()[0].uid, "current");
});

test("missing playback state never treats a pending song as played", () => {
    const read = loadQueueReader({
        Player: {},
        Queue: { nextTracks: [track("pending")] },
    });
    assert.equal(read().length, 0);
});
