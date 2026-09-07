import * as stylex from "@stylexjs/stylex";
import type { ProjectDefinition, Rewards } from "@pop/simulation";
import { Table, TableHeading, TableCell } from "../../ui/table";
import { colors, fontSizes, fontWeights, breakpoints } from "../../ui/tokens.stylex";

export function rewardText(reward: Rewards) {
  const parts: string[] = [];
  if (reward.reputation > 0) parts.push(`${reward.reputation} reputation`);
  if (reward.popularity > 0) parts.push(`${reward.popularity} popularity`);
  if (parts.length === 0) return "No reward";
  return parts.join(" · ");
}

const roles = [
  { key: "support", label: "Support" },
  { key: "oppose", label: "Oppose" },
  { key: "creator", label: "Creator bonus" },
] as const;

export function RewardTable({ definition }: { definition: ProjectDefinition }) {
  return (
    <div {...stylex.props(styles.scroll)}>
      <Table>
        <caption {...stylex.props(styles.caption)}>Reward pools</caption>
        <thead {...stylex.props(styles.head)}>
          <tr>
            <TableHeading xstyle={styles.role} scope="col">
              Your role
            </TableHeading>
            <TableHeading scope="col">If it succeeds</TableHeading>
            <TableHeading scope="col">If it fails</TableHeading>
          </tr>
        </thead>
        <tbody>
          {roles.map(({ key, label }) => (
            <tr key={key}>
              <TableHeading xstyle={styles.role} scope="row">
                {label}
              </TableHeading>
              <TableCell xstyle={styles.reward}>
                {rewardText(definition.rewards.succeeded[key])}
              </TableCell>
              <TableCell xstyle={styles.reward}>
                {rewardText(definition.rewards.failed[key])}
              </TableCell>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

const styles = stylex.create({
  scroll: { overflowX: "auto" },
  caption: {
    textAlign: "left",
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    paddingTop: "14px",
    paddingRight: "0",
    paddingBottom: "12px",
    paddingLeft: "0",
  },
  head: { color: colors.textMuted },
  role: { width: "24%" },
  reward: {
    color: colors.textPositive,
    width: "38%",
    lineHeight: 1.7,
    fontSize: { default: fontSizes.sm, [breakpoints.upToCompact]: fontSizes.xs },
  },
});
