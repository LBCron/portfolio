import { createRepository } from '../create-repository';
import { describeRepositoryContract } from '../repository.contract';
import { createFixtureSource } from './source';

describeRepositoryContract('fixtures', (dataset, logger) =>
  createRepository(createFixtureSource(dataset), logger),
);
