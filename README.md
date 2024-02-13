# Replace Comment HTML

This action upserts HTML in GitHub issue or pull request comments using CSS selectors.

## Usage

Here's an example of how you might use this action in a workflow:

```yaml
name: Deploy Previews

on:
  pull_request:
    branches:
      - main

jobs:
  deploy:
    strategy:
      matrix:
        env: [dev, stage, prod]
    steps:
      # ... steps to deploy preview envionment ...

      # Create a comment with an empty table
      - uses: htunnicliff/replace-comment-html@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          selector: "#preview-links"
          mode: create-only # This will create the table if it doesn't exist
          html: |
            <table id="preview-links">
              <thead>
                <tr>
                  <th>Environment</th>
                  <th>Preview Link</th>
                </tr>
              </thead>
              <tbody>
              </tbody>
            </table>

      # Add a row for the deployed environment
      - uses: htunnicliff/replace-comment-html@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          parent-selector: "#preview-links tbody" # Append this row to the <tbody>
          selector: "tr#preview-link-${{ matrix.env }}"
          mode: upsert # This will update the row if it exists, or create it if it doesn't
          html: |
            <tr id="preview-link-${{ matrix.env }}">
              <td>${{ matrix.env }}</td>
              <td>
                <a href="https://preview-${{ matrix.env }}.example.com">Preview</a>
              </td>
            </tr>

      # ...
```

The resulting comment will contain a table that looks like this:

```html
<table id="preview-links">
  <thead>
    <tr>
      <th>Environment</th>
      <th>Preview Link</th>
    </tr>
  </thead>
  <tbody>
    <tr id="preview-link-dev">
      <td>dev</td>
      <td>
        <a href="https://preview-dev.example.com">Preview</a>
      </td>
    </tr>
    <tr id="preview-link-stage">
      <td>stage</td>
      <td>
        <a href="https://preview-stage.example.com">Preview</a>
      </td>
    </tr>
    <tr id="preview-link-prod">
      <td>prod</td>
      <td>
        <a href="https://preview-prod.example.com">Preview</a>
      </td>
    </tr>
  </tbody>
</table>
```

If this workflow runs again and a row exists with the given CSS selector, it will be replaced with a new version while other HTML remains unmodified.

## Inputs

| Name              | Description                                                                   | Default                    |
| ----------------- | ----------------------------------------------------------------------------- | -------------------------- |
| `html`            | HTML to create or update                                                      |                            |
| `selector`        | A CSS selector for identifying the element to update                          |                            |
| `parent-selector` | A CSS selector for identfying a parent to append the element to               | `null`                     |
| `token`           | `GITHUB_TOKEN` or a repo scoped [personal access token][PAT].                 | `${{ github.token }}`      |
| `repository`      | The repository to update the comment in.                                      | `${{ github.repository }}` |
| `issue-number`    | The issue or pull request number to update the comment in.                    | Current PR or issue number |
| `mode`            | The strategy to use for modifying comments (either `upsert` or `create-only`) | `upsert`                   |

## Outputs

| Name         | Description                                       |
| ------------ | ------------------------------------------------- |
| `comment-id` | The ID of the comment that was created or updated |

[PAT]: https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token
