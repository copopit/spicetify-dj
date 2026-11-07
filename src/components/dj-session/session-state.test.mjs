import assert from "node:assert/strict";
import test from "node:test";
import {
    getPlayedTracks,
    updateSession,
    withTrackKeys,
} from "./session-state.ts";

const track = (uid, uri = `spotify:track:${uid}`) => ({ uid, uri });
const empty = () => ({ history: [], queue: [] });

test("queue reordering and repeated notifications do not add history", () => {
    const first = track("first");
    const second = track("second");
    const third = track("third");
    let state = updateSession(empty(), [first, second, third]);
    state = updateSession(state, [first, third, second]);
    state = updateSession(state, [first, third, second]);
    assert.deepEqual(state.history, []);
    assert.deepEqual(state.queue, [first, third, second]);
    assert.deepEqual(getPlayedTracks(state), [first]);
});

test("track changes record the outgoing track exactly once", () => {
    const first = track("first");
    const second = track("second");
    let state = updateSession(empty(), [first, second]);
    state = updateSession(state, [second]);
    state = updateSession(state, [second]);
    assert.deepEqual(state.history, [first]);
    assert.deepEqual(getPlayedTracks(state), [first, second]);
});

test("auto-pause preserves the last queued song and excludes context", () => {
    const first = track("first");
    const last = track("last");
    const context = track("context");
    let state = updateSession(empty(), [first, last]);
    state = updateSession(state, [last]);
    state = updateSession(state, [context], true);
    state = updateSession(state, [context], true);
    assert.deepEqual(state.history, [first, last]);
    assert.deepEqual(state.queue, []);
    assert.deepEqual(getPlayedTracks(state), [first, last]);
});

test("different queue occurrences of the same song are retained", () => {
    const first = track("first", "spotify:track:same");
    const second = track("second", "spotify:track:same");
    let state = updateSession(empty(), [first, second]);
    state = updateSession(state, [second]);
    assert.deepEqual(getPlayedTracks(state), [first, second]);
});

test("empty playback finalizes the current song", () => {
    const last = track("last");
    let state = updateSession(empty(), [last]);
    state = updateSession(state, []);
    state = updateSession(state, []);
    assert.deepEqual(getPlayedTracks(state), [last]);
});

test("missing UIDs do not duplicate the current song on queue edits", () => {
    const current = track(undefined, "spotify:track:current");
    let state = updateSession(empty(), [current, track("next")]);
    state = updateSession(state, [{ ...current }, track("replacement")]);
    assert.deepEqual(state.history, []);
    assert.deepEqual(getPlayedTracks(state), [current]);
});

test("render keys distinguish repeated plays and survive queue reorder", () => {
    const first = track("first");
    const second = track("second");
    const original = withTrackKeys([first, second]);
    const reordered = withTrackKeys([second, first]);
    assert.equal(original[0].renderKey, reordered[1].renderKey);
    const repeated = withTrackKeys([first, first]);
    assert.notEqual(repeated[0].renderKey, repeated[1].renderKey);
});
