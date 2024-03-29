/**
 * @author Kornel Lugosi (Coornail) - coornail gmail com
 */

var issue_tree = {
  /**
   * Parses the issue body searching for drupal.org issues.
   *
   * @todo strip cookies for iframe
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
   * All the sub nodes.
   *
   * [
   *   2: {id: 2, parent: null, state: 'parsed'},
   *   3: {id: 3, parent: 2, state: 'parsed'},
   *   4: {id 4:, parent: 2, state: 'processing'},
   *   173: {id: 173, parent: 3, state: 'pending'},
   * ]
   */
  sub_nodes : {},

  /**
   * Flag to identify when the parsing is finished.
   * Possible values:
   *   - idle
   *   - processing
   *   - finished
   */
  state: 'idle',

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

    $(context).find(this.issue_link_selector).each(function() {
      if ($(this).text().match(issue_tree.issue_link_selector_regex)) {
        issues.push($(this).attr('href').replace('\/node\/', ''));
      }
    });


    return issues;
  },

  /**
   * Parses the details of an issue.
   */
  get_summary: function(context) {
    // Default context.
    context = context || document.body;

    var summary = {};

    $(issue_tree.issue_summary_selector + ' tr').each(function() {
      var key = $($(this).children()[0]).text().replace(':', '');
      var value = $($(this).children()[1]).text();
      summary[key] = value;
    });

    return summary;
  },

  /**
   * Gets the node id from the context.
   * @todo implement
   */
  get_node_id: function (context) {
    return 66;
  },

  /**
   * @todo implement
   */
  get_title: function(context) {
    return 'noname';
  },

  /**
   * Returns the jQuery object for the subissue iframe.
   */
  get_subissue_iframe: function() {
    return $($('#issue-tree')[0].contentDocument);
  },

  /**
   * Prepares the queue for processing the child issues.
   */
  prepare_queue: function(parent_) {
    var issue_numbers  = issue_tree.get_sub_issues();

    for (var idx in issue_numbers) {
      var issue_number = issue_numbers[idx];
      if (issue_tree.sub_nodes[issue_number] === undefined) {
        issue_tree.sub_nodes[issue_number] = {id: issue_number, parent: parent_, state: 'pending'};
      }
    }

    // Add iframe to load the issues in
    $('body').append('<iframe id="issue-tree" />');

  },

  /**
   * Processes the issue_tree.sub_nodes queue.
   */
  process_queue: function() {
    setTimeout(function() {
      var found_issue_to_process = false;

      for (idx in issue_tree.sub_nodes) {
        if (issue_tree.sub_nodes[idx].state == 'pending' && issue_tree.state != 'finished') {
          issue_tree.state = 'processing';
          issue_tree.process_sub_node(issue_tree.sub_nodes[idx]);
          found_issue_to_process = true;
        }
      }

      if (!found_issue_to_process) {
        issue_tree.state = 'finished';
      } else {
        issue_tree.process_queue();
      }
    },
    3000);
  },

  /**
   * Processes one node from the issue_Tree.sub_nodes
   *
   * @param issue Object
   *   Issue object
   */
  process_sub_node: function(issue) {

    issue.state = 'pending';

    // Add iframe with the issue.
    $('#issue-tree').attr('src', '/node/'+ issue.id + '#no-issue-tree').hide();

    // Iframe onload callback.
    $('#issue-tree').load(function() {
      issue.state = 'processed';
      issue_tree.state = 'idle';

      var children = issue_tree.get_sub_issues(issue_tree.get_subissue_iframe());
      for (idx in children) {
        child = children[idx]
        if (!issue_tree.sub_nodes[child]) {
          issue_tree.sub_nodes[child] = {id: child, parent: issue.id, state: 'pending'};
        }
      }

    });
  },

  /**
   * Builds an issue object.
   *
   * For example:
   *
   * {
   *   id: 123,
   *   name: foobar,
   *   data: {...},
   *   children: [
   *     {
   *       id: 32452,
   *       name: egiocd,
   *       data: {},
   *       children: [...],
   *     },
   *     ...
   *   ]
   * }
   */
  build_issue_object: function(context) {
    // Default context.
    context = context || document.body;
    var issue = {};

    issue['id'] = issue_tree.get_node_id();
    issue['name'] = issue_tree.get_node_id(context);
    issue['title'] = issue_tree.get_title(context);
    issue['data'] = issue_tree.get_summary(context);
    //issue['children'] = issue_tree.parse_sub_issues(context);
    issue_tree.prepare_queue(issue['id']);
    issue_tree.process_queue();

    return issue;
  },


  /**
   * Checks if the page is an issue page or not.
   *
   * @return Bool
   */
  is_issue_page: function() {
    var url = window.location.pathname;

    if (!url.match('^/node/[0-9]*$')) {
      return false;
    }

    return ($('body.node-type-project-issue').length === 1);
  }

}

// Main entry point
if (!window.location.pathname.match('#no-issue-tree') && issue_tree.is_issue_page()) {
  var issue = issue_tree.build_issue_object();
}
