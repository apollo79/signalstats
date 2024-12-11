// select messages from one chat / group
`SELECT
  message.body,
  message.from_recipient_id,
  -- message."type" AS message_type,
FROM
  message
JOIN thread ON message.thread_id = thread._id
JOIN recipient ON thread.recipient_id = recipient._id
WHERE
  recipient._id = 1433
  AND
  message.body IS NOT NULL`;

// select messages from one chat / group with details of sender
`SELECT
  message.body,
  message.from_recipient_id,
  -- message."type" AS message_type,
  sender.system_joined_name,
  sender.profile_joined_name
FROM
  message
JOIN thread ON message.thread_id = thread._id
JOIN recipient AS r ON thread.recipient_id = r._id
JOIN recipient AS sender ON message.from_recipient_id = sender._id
WHERE
  r._id = 4
  AND message.body IS NOT NULL
  AND message.body != ''`;

// select all chats / groups with details
`SELECT
  thread.recipient_id,
  thread.active,
  recipient.profile_joined_name,
  recipient.system_joined_name,
  groups.title
FROM
  thread
  JOIN recipient ON thread.recipient_id = recipient._id
  LEFT JOIN groups ON recipient._id = groups.recipient_id
WHERE (SELECT 1 FROM message WHERE message.thread_id = thread._id AND message.body IS NOT NULL)
`;
