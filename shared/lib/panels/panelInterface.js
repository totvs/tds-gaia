"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isErrors = isErrors;
/**
 * Checks if the provided `errors` object has any keys, indicating that there are errors.
 *
 * @param errors - An object of field errors, where the keys are the field names and the values are the error messages.
 * @returns {boolean} `true` if the `errors` object has any keys, indicating that there are errors, `false` otherwise.
 */
function isErrors(errors) {
    return Object.keys(errors).length > 0;
}
;
//# sourceMappingURL=panelInterface.js.map