/*
Copyright 2024 TOTVS S.A

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

  http: //www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import * as vscode from "vscode";
import { InferType } from "./api/interfaceApi";

export type InferData = {
    documentUri: vscode.Uri,
    range: vscode.Range,
    types: InferType[];
};

/**
* Provides a simple in-memory cache for storing and retrieving data.
*/

class DataCache {
    /**
    * Stores the cached data.
    */
    private cache = new Map<string, any>();

    /**
    * Stores the given value in the cache under the specified key.
    * @param key - The key to use for storing the value.
    * @param value - The value to store in the cache.
    */
    set(key: string, value: any) {
        this.cache.set(key, value);
    }

    /**
    * Retrieves the value stored in the cache under the specified key.
    * @param key - The key to use for retrieving the value.
    * @returns The value stored in the cache under the specified key, or `undefined` if the key is not found.
    */
    get(key: string) {
        return this.cache.get(key);
    }

    /**
    * Checks if the cache contains a value stored under the specified key.
    * @param key - The key to check for.
    * @returns `true` if the cache contains a value for the specified key, `false` otherwise.
    */
    has(key: string) {
        return this.cache.has(key);
    }

    /**
    * Removes the value stored in the cache under the specified key.
    * @param key - The key to use for removing the value.
    * @returns `true` if the value was successfully removed, `false` otherwise.
    */
    delete(key: string) {
        return this.cache.delete(key);
    }

    /**
    * Removes all values from the cache.
    */
    clear() {
        this.cache.clear();
    }
}

export const dataCache = new DataCache();