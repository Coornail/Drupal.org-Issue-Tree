var issue_tree = {
  /**
   * Parses the issue body searching for drupal.org issues.
   */

  // jQuery selector for the issue body.
  issue_selector : '#content-inner',

  // jQuery selector for the issue links (and possibly other links).
  // @todo improve selector
  issue_link_selector: '#content-inner span a',

  // jQuery selector for the issue summary table.
  issue_summary_selector: '#project-issue-summary-table',

  // Regex for parsing out only the issue queue references.
  issue_link_selector_regex: '^#[0-9]*',

  /**
   * Get the issue numbers from the issue body.
   *
   * @return array
   *   Array of issue numbers.
   */
  get_sub_issues: function(context) {
    // Default context.
    context = context || document.body;

    var issues = [];

    $(this.issue_link_selector, context).each(function() {
      if ($(this).text().match(issue_tree.issue_link_selector_regex)) {
        issues.push($(this).attr('href').replace('\/node\/', ''));
      }
    });

    return issues;
  },

  /**
   * Appends iframes to the body with the issue pages.
   *
   * @param issues array
   *   Array of issue ids.
   */
  create_issue_iframes: function(issues) {
    for(idx in issues) {
      var issue = issues[idx]
      $('body').append('<iframe id="issue-'+ issue +'" src="/node/'+ issue +'#no_issue_tree" width="300px" height="300px"></iframe>');
    }
  },

  /**
   * Parses the details of an issue.
   */
  parse_issue_summary: function(context) {
    // Default context.
    context = context || document.body;

    var issue = {};

    $(issue_tree.issue_summary_selector + ' tr').each(function() {
      var key = $($(this).children()[0]).text().replace(':', '');
      var value = $($(this).children()[1]).text();
      issue[key] = value;
    });

    return issue;
  },

}

var issues = issue_tree.get_sub_issues();
var current_issue = issue_tree.parse_issue_summary();
console.log(current_issue);

issue_tree.create_issue_iframes(issues);
