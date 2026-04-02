export { Blasp, blasp } from './blasp.js';
export type { BlaspRuntimeOptions } from './blasp.js';

export { PendingCheck } from './pendingCheck.js';

export { Result } from './core/result.js';
export { MatchedWord } from './core/matchedWord.js';
export { Dictionary } from './core/dictionary.js';
export type { DictionaryOptions } from './core/dictionary.js';

export { Severity, severityWeight, severityIsAtLeast, trySeverity } from './enums/severity.js';
export type { Severity as SeverityLevel } from './enums/severity.js';

export { defaultBlaspConfig, mergeBlaspConfig } from './config/defaultConfig.js';
export type { BlaspConfig, LanguageFileJson } from './config/types.js';

export { RegexDriver } from './drivers/regexDriver.js';
export { PatternDriver } from './drivers/patternDriver.js';
export { PhoneticDriver } from './drivers/phoneticDriver.js';
export type { PhoneticDriverOptions } from './drivers/phoneticDriver.js';
export { PipelineDriver } from './drivers/pipelineDriver.js';

export { CharacterMask } from './core/masking/characterMask.js';
export { GrawlixMask } from './core/masking/grawlixMask.js';
export { CallbackMask } from './core/masking/callbackMask.js';

export type { MaskStrategy } from './core/contracts/maskStrategy.js';
export type { Driver, DetectOptions } from './core/contracts/driver.js';

export type { CacheAdapter } from './cache/types.js';
export { MemoryCache } from './cache/memoryCache.js';

export { AVAILABLE_LANGUAGES, LANGUAGE_DATA, loadLanguageConfig } from './languages/registry.js';
