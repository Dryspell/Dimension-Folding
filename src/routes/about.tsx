import { Title } from "@solidjs/meta";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";

export default function About() {
  return (
    <main class="container py-12">
      <Title>About | Dimension Folding</Title>

      <div class="max-w-3xl mx-auto">
        <div class="mb-8">
          <h1 class="text-3xl font-bold tracking-tight mb-2">About This Project</h1>
          <p class="text-lg text-muted-foreground">
            An academic exploration of the mathematical connections between graphs,
            matroids, and mechanical linkages.
          </p>
        </div>

        <Card class="mb-8">
          <CardHeader>
            <CardTitle>The Dimension Folding Problem</CardTitle>
            <CardDescription>
              A central question in rigidity theory
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4 text-sm leading-relaxed">
            <p>
              Given a graph G realized as a linkage in ℝᵈ (where edges represent rigid bars
              of fixed length), what is the <strong>minimal dimension</strong> ℝᵏ (k ≤ d)
              into which it can be continuously deformed while preserving all edge lengths?
            </p>
            <p>
              This question bridges several areas of mathematics:
            </p>
            <ul class="list-disc pl-6 space-y-2">
              <li>
                <strong>Graph Theory</strong> — The combinatorial structure determines possible motions
              </li>
              <li>
                <strong>Rigidity Theory</strong> — Understanding when frameworks are rigid vs. flexible
              </li>
              <li>
                <strong>Matroid Theory</strong> — Algebraic abstraction of independence in graphs
              </li>
              <li>
                <strong>Kinematics</strong> — The geometry of motion in mechanical systems
              </li>
            </ul>
          </CardContent>
        </Card>

        <div class="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle class="text-base">Key Examples</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="font-mono">K₁,₂ (V-shape)</span>
                <Badge variant="outline">Folds to 1D</Badge>
              </div>
              <Separator />
              <div class="flex items-center justify-between">
                <span class="font-mono">K₃ (Triangle)</span>
                <Badge variant="outline">Minimal 2D</Badge>
              </div>
              <Separator />
              <div class="flex items-center justify-between">
                <span class="font-mono">K₄ (Tetrahedron)</span>
                <Badge variant="outline">Minimal 3D</Badge>
              </div>
              <Separator />
              <div class="flex items-center justify-between">
                <span class="font-mono">K₂,₃ (Bipartite)</span>
                <Badge variant="outline">1 DOF in 2D</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle class="text-base">Mathematical Framework</CardTitle>
            </CardHeader>
            <CardContent class="text-sm space-y-3">
              <p>
                A <strong>framework</strong> is a pair (G, p) where G is a graph and
                p: V → ℝᵈ assigns positions to vertices.
              </p>
              <p>
                The <strong>rigidity matrix</strong> R is the Jacobian of the edge
                length constraints. Its kernel describes infinitesimal motions.
              </p>
              <p>
                A framework is <strong>infinitesimally rigid</strong> if the only
                solutions to Rv = 0 are rigid motions (rotations + translations).
              </p>
            </CardContent>
          </Card>
        </div>

        <Card class="mb-8">
          <CardHeader>
            <CardTitle>Technology Stack</CardTitle>
            <CardDescription>Built with modern web technologies</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex flex-wrap gap-2">
              <Badge>SolidJS</Badge>
              <Badge>SolidStart</Badge>
              <Badge>Three.js</Badge>
              <Badge>Graphology</Badge>
              <Badge>Tailwind CSS</Badge>
              <Badge>SolidUI</Badge>
              <Badge>TypeScript</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>References</CardTitle>
            <CardDescription>Foundational papers and resources</CardDescription>
          </CardHeader>
          <CardContent class="text-sm space-y-2">
            <p>
              <strong>Laman, G.</strong> (1970). "On graphs and rigidity of plane skeletal
              structures." <em>Journal of Engineering Mathematics</em>, 4(4), 331-340.
            </p>
            <p>
              <strong>Connelly, R.</strong> (1980). "The rigidity of certain cabled frameworks."
              <em>Advances in Mathematics</em>, 37(3), 272-299.
            </p>
            <p>
              <strong>Whiteley, W.</strong> (1996). "Some matroids from discrete applied geometry."
              <em>Contemporary Mathematics</em>, 197, 171-311.
            </p>
            <p>
              <strong>Graver, Servatius & Servatius</strong> (1993).
              <em>Combinatorial Rigidity</em>. AMS Graduate Studies in Mathematics.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
