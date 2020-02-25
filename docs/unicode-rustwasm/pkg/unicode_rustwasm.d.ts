/* tslint:disable */
/* eslint-disable */
/**
*/
export function greet(): void;
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
* If `module_or_path` is {RequestInfo}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {RequestInfo | BufferSource | WebAssembly.Module} module_or_path
*
* @returns {Promise<any>}
*/
export default function init (module_or_path?: RequestInfo | BufferSource | WebAssembly.Module): Promise<any>;
        