# Summary

Please include a summary of the change and which issue is fixed. Please also include relevant motivation and context. List any dependencies that are required for this change.

> [!Tip]
> Close issue syntax: `Fixes #<issue number>` or `Resolves #<issue number>`, see [documentation](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword) for more details.

# Impact Areas

Please check the areas this PR affects:

- [ ] Multi-threaded Dialogues
- [ ] AI-Powered Capabilities (Web Search, Knowledge Base Search, Question Recommendations)
- [ ] Context Memory & References
- [ ] Knowledge Base Integration & RAG
- [ ] Quotes & Citations
- [ ] AI Document Editing & WYSIWYG
- [ ] Free-form Canvas Interface
- [ ] Other

# Screenshots/Videos

| Before | After |
| ------ | ----- |
| ...    | ...   |

# Checklist

> [!IMPORTANT]  
> Please review the checklist below before submitting your pull request.

- [ ] This change requires a documentation update, included: [Refly Documentation](https://github.com/langgenius/refly-docs)
- [x] I understand that this PR may be closed in case there was no previous discussion or issues. (This doesn't apply to typos!)
- [x] I've added a test for each change that was introduced, and I tried as much as possible to make a single atomic change.
- [x] I've updated the documentation accordingly.
- [x] I ran `dev/reformat`(backend) and `cd web && npx lint-staged`(frontend) to appease the lint gods
