/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BabelPluginRelay
 * 
 * @format
 */

'use strict';

/**
 * Using babel-plugin-relay with only the modern runtime?
 *
 *     {
 *       plugins: [
 *         "relay"
 *       ]
 *     }
 *
 * Using babel-plugin-relay in compatability or classic mode?
 *
 *     {
 *       plugins: [
 *         ["relay", {"compat": true, "schema": "path/to/schema.graphql"}]
 *       ]
 *     }
 *
 */
module.exports = function BabelPluginRelay(context) {
  var t = context.types;

  if (!t) {
    throw new Error('BabelPluginRelay: Expected plugin context to include "types", but got:' + String(context));
  }

  return {
    visitor: {
      TaggedTemplateExpression: function TaggedTemplateExpression(path, state) {
        // Convert graphql`` literals
        var ast = require('./getValidGraphQLTag')(path);
        if (ast) {
          require('./compileGraphQLTag')(t, path, state, ast);
          return;
        }

        // Convert Relay.QL`` literals

        var _getValidRelayQLTag = require('./getValidRelayQLTag')(path),
            quasi = _getValidRelayQLTag[0],
            tagName = _getValidRelayQLTag[1],
            propName = _getValidRelayQLTag[2];

        if (quasi && tagName) {
          var _schema = state.opts && state.opts.schema;
          require('./invariant')(_schema, 'babel-plugin-relay: Missing schema option. ' + 'Check your .babelrc file or wherever you configure your Babel ' + 'plugins to ensure the "relay" plugin has a "schema" option.\n' + 'https://facebook.github.io/relay/docs/babel-plugin-relay.html#additional-options');
          var documentName = require('./getDocumentName')(path, state);
          path.replaceWith(require('./compileRelayQLTag')(t, path, _schema, quasi, documentName, propName, tagName, true, // enableValidation
          state));
        }
      }
    }
  };
};