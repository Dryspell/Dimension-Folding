import { type JSX, For } from "solid-js";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

interface MatrixTableProps {
  title: string;
  rowLabels: string[];
  colLabels: string[];
  matrix: number[][];
  rounding?: number;
}

export default function MatrixTable(props: MatrixTableProps): JSX.Element {
  return (
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-base">{props.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-20"></TableHead>
              <For each={props.colLabels}>
                {(label) => (
                  <TableHead class="text-center font-mono text-xs">{label}</TableHead>
                )}
              </For>
            </TableRow>
          </TableHeader>
          <TableBody>
            <For each={props.matrix}>
              {(row, rowIndex) => (
                <TableRow>
                  <TableCell class="font-medium font-mono text-xs">
                    {props.rowLabels[rowIndex()]}
                  </TableCell>
                  <For each={row}>
                    {(cell) => (
                      <TableCell class="text-center font-mono text-xs tabular-nums">
                        {props.rounding !== undefined ? cell.toFixed(props.rounding) : cell}
                      </TableCell>
                    )}
                  </For>
                </TableRow>
              )}
            </For>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
