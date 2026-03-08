import React from "react";

/**
 * UploadZoneProps
 * @typedef {Object} UploadZoneProps
 * @property {string} label
 * @property {File|null} file
 * @property {Function} onClear
 * @property {(e: React.ChangeEvent<HTMLInputElement>) => void} onChange
 */

/**
 * User
 * @typedef {Object} User
 * @property {string=} id
 * @property {string=} name
 * @property {string=} email
 */

/**
 * Project
 * @typedef {Object} Project
 * @property {string} id
 * @property {string=} name
 * @property {string=} userId
 * @property {User=} user
 * @property {string} productName
 * @property {string=} productDescription
 * @property {string=} userPrompt
 * @property {string} aspectRatio
 * @property {number=} targetLength
 * @property {string=} generatedImage
 * @property {string=} generatedVideo
 * @property {boolean} isGenerating
 * @property {boolean} isPublished
 * @property {string=} error
 * @property {Date|string} createdAt
 * @property {Date|string=} updatedAt
 * @property {string[]} uploadedImages
 */

export {};
