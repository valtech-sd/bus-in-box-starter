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
        when: 'is-control-activity',
        then: [
          { closure: 'prepare-lighting' },
          { closure: 'prepareAmqpPublishAction' },

        ]
      },
    ]
  },
];
