/**
 * This is an example rule corpus that processes incoming messages
 * Look to https://github.com/valtech-sd/rule-harvester for more information and additional examples of how rules can be used and combined
 **/

module.exports = [
  {
    name: "Log Incoming",
    rules: [
    ]
  },
  {
    name: "Incoming",
    rules: [
      {
        when: 'incoming-http-request',
        then: [
          { closure: 'reformat-http-request' },
        ],
      },

    ]
  },
  {
    name: "Process Activity",
    rules: [
      {
        when: 'isIncomingAmqp',
        then: [
          { closure: "format-incoming-amqp" },
        ]
      },
      {
        // Control activities are events from some type of controller or input
        // This demo assumes certain kinds of controls (inputs) and effects (lighting),
        // but it should be straightforward enough to expand the rules an actions to
        // better-fit events and data (eg UDP).
        when: 'is-control-activity',
        then: [
          // This demo assumes lighting, but it could be anything
          { closure: 'prepare-lighting' },

          // control activities will prepare an amqp message for listening devices to consume
          { closure: 'prepareAmqpPublishAction' },
        ]
      },
    ]
  },
];
