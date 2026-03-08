import "@/app.scss";
import { createRoot } from "react-dom/client";
// you can use aliases too ! (just add them to tsconfig.json)
// import Onboarding from "@/components/Onboarding";
import { Test } from "@/components/show-queue";
import { Container } from "./components/container";
import { DjSession } from "./components/dj-session";
import { GraphView } from "./components/graph-view";
import { Tabs } from "./components/tabs";

function main() {
  const container = document.querySelector(
    "div.Root__top-container",
  ) as HTMLDivElement;

  const spicetifyDjRoot = document.createElement("div");
  spicetifyDjRoot.className = "spicetify-dj-root";
  spicetifyDjRoot.id = "spicetify-dj-root";
  container.appendChild(spicetifyDjRoot);

  const root = createRoot(spicetifyDjRoot);

  root.render(
    <DjSession>
      <Container>
        <Tabs
          tabs={[
            { title: "Session", component: <Test /> },
            { title: "Graph", component: <GraphView /> },
          ]}
        />
      </Container>
    </DjSession>,
  );
}

main();
