import * as core from "@actions/core";
import * as github from "@actions/github";
import * as cheerio from "cheerio";
import { inspect } from "util";

const octokit = github.getOctokit(core.getInput("token"));

const [owner, repo] = core.getInput("repository").split("/");
const issueNumber = +core.getInput("issue-number");

/**
 * @param {string} selector
 */
export async function findExistingComment(selector) {
  core.info(`Finding comment with selector "${selector}"...`);

  const params = {
    owner,
    repo,
    issue_number: issueNumber,
  };

  core.debug(`Request params:\n\n${inspect(params)}`);

  const comments = await octokit.paginate(
    octokit.rest.issues.listComments,
    params,
    ({ data }, done) => {
      const comment = data.find((comment) => {
        const $ = cheerio.load(comment.body ?? "", null, false);

        return $(selector).length > 0;
      });

      if (comment) {
        done();
        return [comment];
      }

      return data;
    }
  );

  if (comments.length > 1) {
    core.warning(
      `Found ${comments.length} comments with the same element selector: ${selector}. Using first comment.`
    );
  }

  if (comments.length === 1) {
    return comments[0];
  }

  return null;
}

/**
 * @param {number} commentId
 * @param {string} body
 */
export async function updateComment(commentId, body) {
  core.info(`Updating comment "${commentId}"...`);

  const params = {
    body,
    comment_id: commentId,
    owner,
    repo,
  };

  core.debug(`Request params:\n\n${inspect(params)}`);

  await octokit.rest.issues.updateComment(params);

  core.setOutput("comment-id", commentId);
}

/**
 * @param {string} body
 */
export async function createComment(body) {
  core.info("Creating comment...");

  const params = {
    body,
    owner,
    repo,
    issue_number: issueNumber,
  };

  core.debug(`Request params:\n\n${inspect(params)}`);

  const newComment = await octokit.rest.issues.createComment(params);

  core.setOutput("comment-id", newComment.data.id);
}
