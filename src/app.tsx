import { MetaProvider, Title, Meta, Link } from "@solidjs/meta";
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
          <Title>Dimension Folding - Interactive Graph Visualization</Title>
          <Meta name="description" content="Explore and visualize complex graph structures with interactive dimension folding. Transform multi-dimensional data into intuitive visual representations." />
          <Meta name="keywords" content="graph visualization, dimension folding, data visualization, interactive graphs, network analysis, data exploration" />
          <Meta name="author" content="Dimension Folding Team" />
          
          {/* OpenGraph */}
          <Meta property="og:type" content="website" />
          <Meta property="og:locale" content="en_US" />
          <Meta property="og:url" content="https://dimension-folding.dev" />
          <Meta property="og:site_name" content="Dimension Folding" />
          <Meta property="og:title" content="Dimension Folding - Interactive Graph Visualization" />
          <Meta property="og:description" content="Explore and visualize complex graph structures with interactive dimension folding. Transform multi-dimensional data into intuitive visual representations." />
          <Meta property="og:image" content="/og-image.png" />
          <Meta property="og:image:width" content="1200" />
          <Meta property="og:image:height" content="630" />
          <Meta property="og:image:alt" content="Dimension Folding - Graph Visualization Platform" />
          
          {/* Twitter Card */}
          <Meta name="twitter:card" content="summary_large_image" />
          <Meta name="twitter:title" content="Dimension Folding - Interactive Graph Visualization" />
          <Meta name="twitter:description" content="Explore and visualize complex graph structures with interactive dimension folding." />
          <Meta name="twitter:image" content="/og-image.png" />
          <Meta name="twitter:creator" content="@dimensionfolding" />
          
          {/* Robots */}
          <Meta name="robots" content="index, follow" />
          <Link rel="canonical" href="https://dimension-folding.dev" />
          
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
