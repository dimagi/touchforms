/*
 * Common workflow methods/widgets go here.
 */ 

function qSelectReqd (caption, choices) {
  return new wfQuestion(caption, 'select', null, choices, true);
}

