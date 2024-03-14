import * as cheerio from 'cheerio';
import * as core from '@actions/core';
import { createComment, findExistingComment, updateComment } from './github.js';

const Mode = {
  Upsert: 'upsert',
  CreateOnly: 'create-only',
};


/**
 * Handle updating/creating an element that is dependent on the presence
 * of a parent element.
 * @param params - Params object
 * @param params.mode - Mode
 * @param params.html - HTML content
 * @param params.selector - Selector
 * @param params.parentSelector - Parent selector
 * @returns Promise which resolves after updating element
 */
async function handleDependentElement(params: {
  mode: string;
  html: string;
  selector: string;
  parentSelector: string;
}) {
  const { mode, html, selector, parentSelector } = params;
  core.debug('Dependent element');

  const comment = await findExistingComment(parentSelector);

  if (!comment) {
    throw new Error(
      `Could not find comment using parent selector: ${parentSelector}.`
    );
  }

  if (!comment.body) {
    // Note: This should never happen
    throw new Error(`Could not find body in comment: ${comment.id}`);
  }

  const $ = cheerio.load(comment.body, null, false);
  const $parent = $(parentSelector);
  const $element = $parent.find(selector);

  switch (mode) {
    case Mode.CreateOnly: {
      if ($element.length === 0) {
        core.info(
          `Element does not exist, creating and appending to parent "${parentSelector}"...`
        );
        $parent.append(html);
      } else {
        core.info(
          `Existing element at selector "${selector}" will not be updated – mode is ${Mode.CreateOnly}`
        );
      }
      break;
    }
    case Mode.Upsert: {
      if ($element.length > 0) {
        core.info(
          `Existing element found at selector "${selector}", updating...`
        );
        $element.replaceWith(html);
      } else {
        core.info(
          `Element does not exist, creating and appending to parent "${parentSelector}"...`
        );
        $parent.append(html);
      }
      break;
    }
    default: {
      throw new Error(`Invalid mode: ${mode}`);
    }
  }

  await updateComment(comment.id, $.html());
}

/**
 * Handle updating/creating an element that is not dependent on a parent
 * element.
 * @param params - Params object
 * @param params.mode - Mode
 * @param params.html - HTML content
 * @param params.selector - Selector
 */
async function handleIndependentElement(params: {
  mode: string;
  html: string;
  selector: string;
}) {
  const { mode, html, selector } = params;

  core.debug('Independent element');

  const comment = await findExistingComment(selector);

  // New comment
  if (!comment) {
    const $ = cheerio.load(html, null, false);
    const body = $.html();
    await createComment(body);
    return;
  }

  if (!comment.body) {
    // Note: This should never happen
    throw new Error(`Could not find body in comment: ${comment.id}`);
  }

  switch (mode) {
    case Mode.Upsert: {
      const $ = cheerio.load(comment.body, null, false);
      const $element = $(selector);
      if ($element.length > 0) {
        core.info(
          `Existing element found at selector "${selector}", updating...`
        );
        $element.replaceWith(html);
      } else {
        core.info(
          'Element does not exist, creating and appending to comment root...'
        );
        $.root().append(html);
      }

      await updateComment(comment.id, $.html());
      break;
    }
    case Mode.CreateOnly: {
      core.setOutput('comment-id', comment.id);
      core.info(
        `Existing element ${selector} will not be updated since mode is ${Mode.CreateOnly}`
      );
      break;
    }
    default: {
      throw new Error(`Invalid mode: ${mode}`);
    }
  }
}

/**
 *
 * @param params - Params object
 * @param params.mode - Mode
 * @param params.html - HTML content
 * @param params.selector - Selector
 * @param params.parentSelector - Parent selector
 * @returns Promise which resolves after updating element
 */
export async function action(params: {
  mode: string;
  html: string;
  selector: string;
  parentSelector: string | null;
}) {
  const { mode, html, selector, parentSelector } = params;

  if (parentSelector) {
    return handleDependentElement({
      mode,
      html,
      selector,
      parentSelector,
    });
  }

  return handleIndependentElement({
    mode,
    html,
    selector,
  });
}
