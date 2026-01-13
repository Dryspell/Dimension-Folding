import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./app.css";

import MainNav from "~/components/main-nav";

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>Dimension Folding</Title>
          <div class="min-h-screen bg-background">
            <MainNav />
            <Suspense>{props.children}</Suspense>
          </div>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
