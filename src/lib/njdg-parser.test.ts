import { describe, expect, it } from "vitest";
import { parseNjdgSnapshotHtml } from "./njdg-parser";

const fixture = `
  <h4>Pending Civil Cases</h4><div>74,206</div>
  <h4>Pending Criminal Cases</h4><div>21,685</div>
  <h4>Total Pending Cases</h4><div>95,891</div>
  <div>Instituted in last month civil cases 2,681 Instituted in last month criminal cases 1,468 Instituted in last month total cases 4,149</div>
  <div>Disposal in last month civil cases 966 (36.03%) Disposal in last month criminal cases 560 (38.15%) Disposal in last month total cases 1,526</div>
  <table>
    <tr><td>Cases Disposed In Last Month(more than 10 years old)</td><td>39</td><td>10</td><td>49</td></tr>
    <tr><td>3 Judges</td><td>167 (1067)</td><td>56 (179)</td><td>223 (1246)</td></tr>
    <tr><td>5 Judges</td><td>19 (169)</td><td>3 (6)</td><td>22 (175)</td></tr>
    <tr><td>7 Judges</td><td>4 (26)</td><td>1 (8)</td><td>5 (34)</td></tr>
    <tr><td>9 Judges</td><td>2 (46)</td><td>0 (0)</td><td>2 (46)</td></tr>
    <tr><td>11 Judges</td><td>0 (0)</td><td>0 (0)</td><td>0 (0)</td></tr>
    <tr><td>More than 11 Judges</td><td>0 (0)</td><td>0 (0)</td><td>0 (0)</td></tr>
  </table>
  <footer>24-07-2026 06:32:21</footer>
`;

describe("parseNjdgSnapshotHtml", () => {
  it("extracts the Supreme Court At a Glance metrics", () => {
    const result = parseNjdgSnapshotHtml(fixture);

    expect(result.totalPending).toBe(95_891);
    expect(result.civilPending).toBe(74_206);
    expect(result.criminalPending).toBe(21_685);
    expect(result.institutedThisMonth).toBe(4_149);
    expect(result.disposedThisMonth).toBe(1_526);
    expect(result.oldCasesDisposedThisMonth).toBe(49);
    expect(result.coramPending).toEqual([
      { benchSize: "3 Judges", pending: 1_246 },
      { benchSize: "5 Judges", pending: 175 },
      { benchSize: "7 Judges", pending: 34 },
      { benchSize: "9 Judges", pending: 46 },
      { benchSize: "11 Judges", pending: 0 },
      { benchSize: "More than 11 Judges", pending: 0 },
    ]);
    expect(result.capturedAt).toBe("2026-07-24T01:02:21.000Z");
  });

  it("rejects inconsistent pending totals", () => {
    expect(() =>
      parseNjdgSnapshotHtml(fixture.replace("95,891", "95,890")),
    ).toThrow(/do not equal total pendency/);
  });
});
