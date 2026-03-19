import { BrowserRouter } from "react-router-dom";
import { Root } from "./Root";

function App() {
  return (
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  );
}

function createClientApp() {
  return <App />;
}

export { App, createClientApp };
