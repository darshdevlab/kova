import { createRoot } from "react-dom/client";
import { useState } from "react";
import { AIProvidersPanel } from "../../src/components/providers/ai-providers-panel";
import { HomeModelControls } from "../../src/components/providers/home-model-controls";
const params = new URLSearchParams(location.search);
function HomeFixture() {
  const [model, setModel] = useState("auto");
  const [connectionId, setConnectionId] = useState("");
  const [ready, setReady] = useState(false);
  return <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: 12 }}><HomeModelControls spaceId="e55a25aa-0a16-4bfc-b455-043a97067217" model={model} onModelChange={setModel} connectionId={connectionId} onConnectionChange={setConnectionId} onReadyChange={setReady} /><button disabled={!ready}>Build</button></div>;
}
createRoot(document.getElementById("root")!).render(params.has("home") ? <HomeFixture /> : <AIProvidersPanel spaceId="e55a25aa-0a16-4bfc-b455-043a97067217" role={params.get("role") || "Owner"} />);
