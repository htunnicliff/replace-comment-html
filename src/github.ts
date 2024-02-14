import { debug, getInput, info, setOutput, warning } from "@actions/core";
import { getOctokit } from "@actions/github";
import * as cheerio from "cheerio";
import { inspect } from "node:util";

const octokit = getOctokit(getInput("token"));
const [owner, repo] = getInput("repository").split("/");
const issueNumber = +getInput("issue-number");

export async function findExistingComment(selector: string) {
  info(`Finding comment with selector "${selector}"...`);

  const params = {
    owner,
    repo,
    issue_number: issueNumber,
  };

  debug(`Request params:\n\n${inspect(params)}`);

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
    warning(
      `Found ${comments.length} comments with the same element selector: ${selector}. Using first comment.`
    );
  }

  if (comments.length === 1) {
    return comments[0];
  }

  return null;
}

export async function updateComment(commentId: number, body: string) {
  info(`Updating comment "${commentId}"...`);

  const params = {
    body,
    comment_id: commentId,
    owner,
    repo,
  };

  debug(`Request params:\n\n${inspect(params)}`);

  await octokit.rest.issues.updateComment(params);

  setOutput("comment-id", commentId);
}

export async function createComment(body: string) {
  info("Creating comment...");

  const params = {
    body,
    owner,
    repo,
    issue_number: issueNumber,
  };

  debug(`Request params:\n\n${inspect(params)}`);

  const newComment = await octokit.rest.issues.createComment(params);

  setOutput("comment-id", newComment.data.id);
}
