import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

export default function Home() {
  return (
    <main class="flex-1">
      <Title>Dimension Folding</Title>

      {/* Hero section */}
      <section class="container py-12 md:py-24 lg:py-32">
        <div class="flex flex-col items-center text-center gap-4">
          <Badge variant="secondary" class="mb-2">
            Academic Exploration Project
          </Badge>
          <h1 class="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Dimension
            <span class="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              {" "}Folding
            </span>
          </h1>
          <p class="max-w-[700px] text-lg text-muted-foreground md:text-xl">
            Explore the mathematical relationship between graphs, matroids, and linkages.
            Visualize how abstract combinatorial structures manifest as mechanical systems in 3D space.
          </p>
          <div class="flex gap-4 mt-4">
            <Button as={A} href="/graphs/exploration" size="lg">
              Start Exploring
            </Button>
            <Button as={A} href="/about" variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section class="container py-12 md:py-24">
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div class="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6 text-primary">
                  <circle cx="12" cy="12" r="3" />
                  <circle cx="19" cy="5" r="2" />
                  <circle cx="5" cy="5" r="2" />
                  <circle cx="5" cy="19" r="2" />
                  <circle cx="19" cy="19" r="2" />
                  <line x1="12" y1="9" x2="12" y2="5" />
                  <line x1="9.5" y1="13.5" x2="5" y2="17" />
                  <line x1="14.5" y1="13.5" x2="19" y2="17" />
                </svg>
              </div>
              <CardTitle>Graph Visualization</CardTitle>
              <CardDescription>
                Render graphs as both 2D layouts and 3D mechanical linkages with interactive controls.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div class="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6 text-primary">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <CardTitle>Constraint Analysis</CardTitle>
              <CardDescription>
                Visualize distance constraints as sphere intersections showing allowable vertex positions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div class="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6 text-primary">
                  <path d="M3 3v18h18" />
                  <path d="M18 9l-5-5-4 4-3-3" />
                </svg>
              </div>
              <CardTitle>Matrix Representations</CardTitle>
              <CardDescription>
                Explore adjacency, incidence, and coordinate matrices that encode graph structure.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div class="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6 text-primary">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              </div>
              <CardTitle>Rigidity Theory</CardTitle>
              <CardDescription>
                Understand when frameworks are rigid vs. flexible using infinitesimal motion analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Coming Soon</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div class="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6 text-primary">
                  <path d="M12 22V8" />
                  <path d="M5 12H2a10 10 0 0020 0h-3" />
                  <circle cx="12" cy="5" r="3" />
                </svg>
              </div>
              <CardTitle>Dimension Folding</CardTitle>
              <CardDescription>
                Discover minimal dimensions into which linkages can be continuously folded.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Coming Soon</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div class="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6 text-primary">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <CardTitle>Matroid Connections</CardTitle>
              <CardDescription>
                Explore the relationship between graphic matroids and rigidity matroids.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Coming Soon</Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Example graphs section */}
      <section class="container py-12 md:py-24 border-t">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold tracking-tighter mb-4">Example Graphs</h2>
          <p class="text-muted-foreground max-w-[600px] mx-auto">
            Explore these fundamental graph structures and their dimension folding properties.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-3">
          <Card class="relative overflow-hidden">
            <div class="absolute top-4 right-4">
              <Badge>Dimension 1</Badge>
            </div>
            <CardHeader>
              <CardTitle class="font-mono">K₁,₂</CardTitle>
              <CardDescription>V-Graph / Star on 3 vertices</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="h-32 flex items-center justify-center">
                <svg viewBox="0 0 100 80" class="w-32 h-24">
                  <line x1="50" y1="20" x2="20" y2="60" stroke="currentColor" stroke-width="2" class="text-muted-foreground" />
                  <line x1="50" y1="20" x2="80" y2="60" stroke="currentColor" stroke-width="2" class="text-muted-foreground" />
                  <circle cx="50" cy="20" r="8" fill="currentColor" class="text-primary" />
                  <circle cx="20" cy="60" r="8" fill="currentColor" class="text-blue-500" />
                  <circle cx="80" cy="60" r="8" fill="currentColor" class="text-green-500" />
                </svg>
              </div>
              <p class="text-sm text-muted-foreground mt-4">
                1 internal DOF — can fold to a 1-dimensional line
              </p>
            </CardContent>
          </Card>

          <Card class="relative overflow-hidden">
            <div class="absolute top-4 right-4">
              <Badge>Dimension 2</Badge>
            </div>
            <CardHeader>
              <CardTitle class="font-mono">K₃</CardTitle>
              <CardDescription>Triangle / Complete graph on 3</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="h-32 flex items-center justify-center">
                <svg viewBox="0 0 100 80" class="w-32 h-24">
                  <line x1="50" y1="15" x2="20" y2="65" stroke="currentColor" stroke-width="2" class="text-muted-foreground" />
                  <line x1="50" y1="15" x2="80" y2="65" stroke="currentColor" stroke-width="2" class="text-muted-foreground" />
                  <line x1="20" y1="65" x2="80" y2="65" stroke="currentColor" stroke-width="2" class="text-muted-foreground" />
                  <circle cx="50" cy="15" r="8" fill="currentColor" class="text-primary" />
                  <circle cx="20" cy="65" r="8" fill="currentColor" class="text-blue-500" />
                  <circle cx="80" cy="65" r="8" fill="currentColor" class="text-green-500" />
                </svg>
              </div>
              <p class="text-sm text-muted-foreground mt-4">
                0 internal DOF — rigid in 2D, cannot fold further
              </p>
            </CardContent>
          </Card>

          <Card class="relative overflow-hidden">
            <div class="absolute top-4 right-4">
              <Badge>Dimension 3</Badge>
            </div>
            <CardHeader>
              <CardTitle class="font-mono">K₄</CardTitle>
              <CardDescription>Tetrahedron / Complete graph on 4</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="h-32 flex items-center justify-center">
                <svg viewBox="0 0 100 80" class="w-32 h-24">
                  <line x1="50" y1="10" x2="15" y2="55" stroke="currentColor" stroke-width="2" class="text-muted-foreground" />
                  <line x1="50" y1="10" x2="85" y2="55" stroke="currentColor" stroke-width="2" class="text-muted-foreground" />
                  <line x1="50" y1="10" x2="50" y2="70" stroke="currentColor" stroke-width="2" class="text-muted-foreground" />
                  <line x1="15" y1="55" x2="85" y2="55" stroke="currentColor" stroke-width="2" class="text-muted-foreground" />
                  <line x1="15" y1="55" x2="50" y2="70" stroke="currentColor" stroke-width="2" class="text-muted-foreground" />
                  <line x1="85" y1="55" x2="50" y2="70" stroke="currentColor" stroke-width="2" class="text-muted-foreground" />
                  <circle cx="50" cy="10" r="6" fill="currentColor" class="text-primary" />
                  <circle cx="15" cy="55" r="6" fill="currentColor" class="text-blue-500" />
                  <circle cx="85" cy="55" r="6" fill="currentColor" class="text-green-500" />
                  <circle cx="50" cy="70" r="6" fill="currentColor" class="text-purple-500" />
                </svg>
              </div>
              <p class="text-sm text-muted-foreground mt-4">
                0 internal DOF — rigid in 3D, minimally 3-dimensional
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer class="border-t py-6 md:py-8">
        <div class="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p class="text-sm text-muted-foreground">
            An academic exploration of rigidity theory and dimension folding.
          </p>
          <p class="text-sm text-muted-foreground">
            Built with SolidJS, Three.js & SolidUI
          </p>
        </div>
      </footer>
    </main>
  );
}
