import { createFixtureDataset, type FixtureDataset } from './dataset';

const store = globalThis as { __jmFixtureDataset?: FixtureDataset };

/**
 * One dataset per process, shared by the public reads and the admin writes,
 * even if the bundler instantiates this module more than once.
 */
export function getFixtureDataset(): FixtureDataset {
  return (store.__jmFixtureDataset ??= createFixtureDataset());
}
