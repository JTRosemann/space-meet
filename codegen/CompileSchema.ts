import { writeFileSync } from 'fs';
import { compileFromFile } from 'json-schema-to-typescript';
// uses this: https://github.com/bcherny/json-schema-to-typescript

// compile from file
compileFromFile('codegen/built/game-schema.json')
  .then(ts => writeFileSync('codegen/built/GameSchema.d.ts', ts))
