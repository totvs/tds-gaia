import * as vscode from 'vscode';

// export interface Config {
//     modelIdOrEndpoint: string;
//     "fillInTheMiddle.enabled": boolean;
//     "fillInTheMiddle.prefix": string;
//     "fillInTheMiddle.middle": string;
//     "fillInTheMiddle.suffix": string;
//     temperature: number;
//     contextWindow: number;
//     tokensToClear: string[];
//     tokenizer: TokenizerPathConfig | TokenizerRepoConfig | TokenizerUrlConfig | null;
// }

// const StarCoderConfig: Config = {
//     modelIdOrEndpoint: "bigcode/starcoder",
//     "fillInTheMiddle.enabled": true,
//     "fillInTheMiddle.prefix": "<fim_prefix>",
//     "fillInTheMiddle.middle": "<fim_middle>",
//     "fillInTheMiddle.suffix": "<fim_suffix>",
//     temperature: 0.2,

/*
          "tds-dito.requestDelay": {
            "type": "integer",
            "default": 150,
            "description": "Delay between requests in milliseconds"
          },
          "tds-dito.enableAutoSuggest": {
            "type": "boolean",
            "default": true,
            "description": "Enable automatic suggestions"
          },
          "tds-dito.configTemplate": {
            "type": "string",
            "enum": [
              "bigcode/starcoder",
            ],
            "default": "bigcode/starcoder",
            "description": "Choose your model template from the dropdown."
          },
          "tds-dito.modelIdOrEndpoint": {
            "type": "string",
            "default": "bigcode/starcoder",
            "description": "Supply TOTVS model id (ex: `bigcode/starcoder`) or custom endpoint (ex: https://bigcode-large-xl.eu.ngrok.io/generate) to which requests will be sent. When totvs model id is supplied, hugging face API inference will be used."
          },
          "tds-dito.fillInTheMiddle.enabled": {
            "type": "boolean",
            "default": true,
            "description": "Enable fill in the middle for the current model"
          },
          "tds-dito.fillInTheMiddle.prefix": {
            "type": "string",
            "default": "<fim_prefix>",
            "description": "Prefix token"
          },
          "tds-dito.fillInTheMiddle.middle": {
            "type": "string",
            "default": "<fim_middle>",
            "description": "Middle token"
          },
          "tds-dito.fillInTheMiddle.suffix": {
            "type": "string",
            "default": "<fim_suffix>",
            "description": "Suffix token"
          },
          "tds-dito.temperature": {
            "type": "float",
            "default": 0.2,
            "description": "Sampling temperature"
          },
          "tds-dito.maxNewTokens": {
            "type": "integer",
            "default": 60,
            "description": "Max number of new tokens to be generated. The accepted range is [50-500] both ends inclusive. Be warned that the latency of a request will increase with higher number."
          },
          "tds-dito.contextWindow": {
            "type": "integer",
            "default": 8192,
            "description": "Context window of the model"
          },
          "tds-dito.tokensToClear": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "default": [
              "<|endoftext|>"
            ],
            "description": "(Optional) Tokens that should be cleared from the resulting output. For example, in FIM mode, one usually wants to clear FIM token from resulting outout."
          },
          "tds-dito.attributionWindowSize": {
            "type": "integer",
            "default": 250,
            "description": "Number of characters to scan for code attribution"
          },
          "tds-dito.attributionEndpoint": {
            "type": "string",
            "default": "https://stack.dataportraits.org/overlap",
            "description": "Endpoint to which attribution request will be sent to (https://stack.dataportraits.org/overlap for the stack)."
          },
          "tds-dito.tlsSkipVerifyInsecure": {
            "type": "boolean",
            "default": false,
            "description": "Skip TLS verification for insecure connections"
          },
          "tds-dito.lsp.binaryPath": {
            "type": [
              "string",
              "null"
            ],
            "default": null,
            "description": "Path to llm-ls binary, useful for debugging or when building from source"
          },
          "tds-dito.lsp.logLevel": {
            "type": "string",
            "default": "warn",
            "description": "llm-ls log level"
          },
          "tds-dito.tokenizer": {
            "type": [
              "object",
              "null"
            ],
            "default": null,
            "description": "Tokenizer configuration for the model, check out the documentation for more details"
          },
          "tds-dito.documentFilter": {
            "type": [
              "object",
              "array"
            ],
            "default": {
              "pattern": "**"
            },
            "description": "Filter documents to enable suggestions for"
          }
*/

export type TDitoConfig = {
    version: string;
    modelIdOrEndpoint: string;
    documentFilter: vscode.DocumentFilter;
    //     "fillInTheMiddle.enabled": boolean;
    //     "fillInTheMiddle.prefix": string;
    //     "fillInTheMiddle.middle": string;
    //     "fillInTheMiddle.suffix": string;
    //     temperature: number;
    //     contextWindow: number;
    //     tokensToClear: string[];
    //     tokenizer: TokenizerPathConfig | TokenizerRepoConfig | TokenizerUrlConfig | null;
    userLogin: boolean,
}

export function getDitoConfiguration(): TDitoConfig {
    const config: any = vscode.workspace.getConfiguration("tds-dito");

    return config;

    // "bigcode/starcoder": StarCoderConfig,
    // "codellama/CodeLlama-13b-hf": CodeLlama13BConfig,
    // "Phind/Phind-CodeLlama-34B-v2": PhindCodeLlama34Bv2Config,
    // "WizardLM/WizardCoder-Python-34B-V1.0": WizardCoderPython34Bv1Config,
}