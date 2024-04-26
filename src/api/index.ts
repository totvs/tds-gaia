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

import { ChatApi } from "./chatApi";
import { FeedbackApi } from "./feedbackApi";
import { IaApiInterface } from "./interfaceApi";
import { LLMApi } from "./llmApi";

/**
* Exports an instance of the `ChatApi` class, which provides an interface for interacting with the chat API.
*/
export const chatApi: ChatApi = new ChatApi();

/**
* Provides an instance of the `llmApi.` class, which implements the `IaApiInterface` interface.
* This API is used for interacting with the Carol AI system.
*/
export const llmApi: IaApiInterface = new LLMApi();

/**
* Exports an instance of the `FeedbackApi` class, which provides an interface for interacting with the feedback API.
*/
export const feedbackApi: FeedbackApi = new FeedbackApi();
