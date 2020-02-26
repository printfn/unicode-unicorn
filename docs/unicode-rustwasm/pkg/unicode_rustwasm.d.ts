/* tslint:disable */
/* eslint-disable */
/**
*/
export function greet(): void;
/**
*/
export function init(): void;
/**
* @param {number} codepoint 
* @returns {number} 
*/
export function next_codepoint(codepoint: number): number;
/**
* @param {number} codepoint 
* @returns {number} 
*/
export function previous_codepoint(codepoint: number): number;
/**
* @param {number} codepoint 
* @returns {string} 
*/
export function variation_sequences_for_codepoint(codepoint: number): string;
/**
* @param {Uint8Array} utf8_bytes 
* @returns {Uint32Array | undefined} 
*/
export function u8toc(utf8_bytes: Uint8Array): Uint32Array | undefined;
/**
* @param {Uint32Array} codepoints 
* @returns {Uint8Array | undefined} 
*/
export function ctou8(codepoints: Uint32Array): Uint8Array | undefined;

/**
* If `module_or_path` is {RequestInfo}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {RequestInfo | BufferSource | WebAssembly.Module} module_or_path
*
* @returns {Promise<any>}
*/
export default function init (module_or_path?: RequestInfo | BufferSource | WebAssembly.Module): Promise<any>;
        