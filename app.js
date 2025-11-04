require('dotenv').config();
const { App } = require('@slack/bolt');
const fetch = require('node-fetch'); // For Node <18, else remove if using Node 18+

/** -----------------------------
 * Services list (unchanged)
 * ----------------------------- */
const SERVICES = ['Messaging', 'Advertisement', 'Naming', 'Strategy'];

const SERVICE_OPTIONS = SERVICES.map(s => ({
  text: { type: 'plain_text', text: s },
  value: s,
}));

/** -----------------------------
 * Question registry
 * ----------------------------- */
const COMMON_QUESTIONS = [
  {
    id: 'client_materials',
    appliesTo: ['Messaging', 'Naming', 'Strategy'],
    label: 'How many client materials to review?',
    type: 'static_select',
    options: ['3', '5', '10', '15'],
  },
  {
    id: 'competitors_analyze',
    appliesTo: ['Messaging', 'Naming', 'Strategy'],
    label: 'How many competitors to analyze?',
    type: 'static_select',
    options: ['2', '3', '5', '8'],
  },
  {
    id: 'stakeholders_interview',
    appliesTo: ['Naming', 'Strategy'],
    label: 'How many stakeholders to interview?',
    type: 'static_select',
    options: ['4', '8', '12', '20'],
  },

  /** Messaging-only questions **/
  {
    id: 'messaging_strategy_session',
    appliesTo: ['Messaging'],
    label: 'How long of a strategy work session is required?',
    type: 'static_select',
    options: ['60 minutes', '1.5 hours', '4 hours'],
  },
  {
    id: 'messaging_review_rounds',
    appliesTo: ['Messaging'],
    label: 'How many rounds of review?',
    type: 'static_select',
    options: ['None', 'One', 'Two', 'Three'],
  },
  {
    id: 'messaging_primary_target_audiences',
    appliesTo: ['Messaging'],
    label: 'How many primary target audiences should be prioritised?',
    type: 'static_select',
    options: ['Zero','One','Two','Three'],
  },
  {
    id: 'messaging_sharp_messaging_themes',
    appliesTo: ['Messaging'],
    label: 'How many sharp messaging themes to anchor all launch communications?',
    type: 'static_select',
    options: ['Zero','One','Two','Three'],
  },
  {
    id: 'messaging_headline_options',
    appliesTo: ['Messaging'],
    label: 'How many headline options?',
    type: 'static_select',
    options: ['Zero','One','Two','Three'],
  },
  {
    id: 'messaging_topline_demos_of_existing_products',
    appliesTo: ['Messaging'],
    label: 'How many topline demos of existing products and product roadmaps to attend?',
    type: 'static_select',
    options: ['Zero','One','Two','Three'],
  },
  {
    id: 'messaging_facilitate_the_work',
    appliesTo: ['Messaging'],
    label: 'How to facilitate the work session?',
    type: 'static_select',
    options: ['In-person','Virtual'],
  },
  {
    id: 'messaging_top-level_messages',
    appliesTo: ['Messaging'],
    label: 'How many top-level messages are aligned with the strategic vision?',
    type: 'static_select',
    options: ['Zero','One','Two','Three'],
  },
  {
    id: 'messaging_rounds_of_refinement',
    appliesTo: ['Messaging'],
    label: 'How many rounds of refinement?',
    type: 'static_select',
    options: ['Zero','One','Two','Three'],
  },
  {
    id: 'messaging_dedicated_rounds_of_internal_feedback',
    appliesTo: ['Messaging'],
    label: 'How many dedicated rounds of internal feedback and revisions to final deliverables?',
    type: 'static_select',
    options: ['Zero','One','Two','Three'],
  },
  {
    id: 'messaging_hour_worksession_with_internal_teams',
    appliesTo: ['Messaging'],
    label: 'How many hour worksession with internal teams and leadership?',
    type: 'static_select',
    options: ['Zero','One','Two','Three'],
  },
  {
    id: 'messaging_core_messages_aligned',
    appliesTo: ['Messaging'],
    label: 'How many core messages aligned to the Client’s strategic vision?',
    type: 'static_select',
    options: ['Zero','One','Two','Three'],
  },
  {
    id: 'messaging_interviews_with_internal_stakeholders',
    appliesTo: ['Messaging'],
    label: 'How many interviews with internal stakeholders?',
    type: 'static_select',
    options: ['Zero','Three','Five','Seven'],
  },
  {
    id: 'messaging_best_practices_communication',
    appliesTo: ['Messaging'],
    label: 'How many best practices communication assets?',
    type: 'static_select',
    options: ['Zero','Three','Five','Seven'],
  },
  {
    id: 'messaging_payment_timeline_from_the_invoice',
    appliesTo: ['Messaging'],
    label: 'What is the payment timeline from the invoice date for work delivered to the client?',
    type: 'static_select',
    options: ['15 days','30 days','45 days','60 days'],
  },
  {
    id: 'messaging_product_information_session',
    appliesTo: ['Messaging'],
    label: 'How many product information session led by the client?',
    type: 'static_select',
    options: ['Zero','One','Two','Three'],
  },
  {
    id: 'messaging_demos_for_existing_products',
    appliesTo: ['Messaging'],
    label: 'How many demos for existing products to be attended?',
    type: 'static_select',
    options: ['Zero','Two','Four','Six'],
  },
  {
    id: 'messaging_tailored_version_of_the_message_framework',
    appliesTo: ['Messaging'],
    label: 'How many tailored version of the message framework to include messaging?',
    type: 'static_select',
    options: ['Zero','One','Two','Three'],
  },
  {
    id: 'messaging_high_impact_touchpoints',
    appliesTo: ['Messaging'],
    label: 'How many high-impact touchpoints?',
    type: 'static_select',
    options: ['Zero','One','Two','Three'],
  },
  {
    id: 'messaging_How_many_product_messages',
    appliesTo: ['Messaging'],
    label: 'How many product messages?',
    type: 'static_select',
    options: ['Zero','One','Two','Three'],
  },
  {
    id: 'messaging_Recommendations_on_how_product',
    appliesTo: ['Messaging'],
    label: 'How many recommendations on how product messaging integrates?',
    type: 'static_select',
    options: ['Zero','One','Two','Three'],
  },
  {
    id: 'messaging_60-minute_virtual_workshop',
    appliesTo: ['Messaging'],
    label: 'How many 60-minute virtual workshop?',
    type: 'static_select',
    options: ['Zero','One','Two','Three'],
  },
  {
    id: 'messaging_do’s_and_don’ts_suggestions',
    appliesTo: ['Messaging'],
    label: 'How many tactical do’s and don’ts suggestions?',
    type: 'static_select',
    options: ['Zero','Four','Eight','Twelve'],
  },
  {
    id: 'messaging_clear_behavioral_commitments',
    appliesTo: ['Messaging'],
    label: 'How many clear behavioral commitments?',
    type: 'static_select',
    options: ['Zero','One','Two','Three'],
  },
];

/** -----------------------------
 * Messaging Complexity → Questions mapping
 * ----------------------------- */
const MESSAGING_COMPLEXITY_QUESTIONS = {
  Light: [
    'client_materials','competitors_analyze','messaging_strategy_session','messaging_review_rounds',
    'messaging_primary_target_audiences','messaging_sharp_messaging_themes','messaging_headline_options',
  ],
  Medium: [
    'client_materials','competitors_analyze','messaging_strategy_session','messaging_review_rounds',
    'messaging_topline_demos_of_existing_products','messaging_facilitate_the_work',
    'messaging_top-level_messages','messaging_rounds_of_refinement','messaging_dedicated_rounds_of_internal_feedback',
    'messaging_hour_worksession_with_internal_teams','messaging_core_messages_aligned',
  ],
  Large: [
    'client_materials','competitors_analyze','messaging_strategy_session','messaging_review_rounds',
    'messaging_topline_demos_of_existing_products','messaging_interviews_with_internal_stakeholders',
    'messaging_facilitate_the_work','messaging_top-level_messages','messaging_best_practices_communication',
    'messaging_rounds_of_refinement','messaging_hour_worksession_with_internal_teams','messaging_core_messages_aligned',
    'messaging_dedicated_rounds_of_internal_feedback','messaging_payment_timeline_from_the_invoice',
  ],
  'Extra Large': [
    'client_materials','competitors_analyze','messaging_strategy_session','messaging_review_rounds',
    'messaging_demos_for_existing_products','messaging_interviews_with_internal_stakeholders','messaging_facilitate_the_work',
    'messaging_hour_worksession_with_internal_teams','messaging_top-level_messages','messaging_best_practices_communication',
    'messaging_rounds_of_refinement','messaging_core_messages_aligned','messaging_dedicated_rounds_of_internal_feedback',
    'messaging_product_information_session','messaging_tailored_version_of_the_message_framework','messaging_high_impact_touchpoints',
    'messaging_How_many_product_messages','messaging_Recommendations_on_how_product','messaging_60-minute_virtual_workshop',
    'messaging_do’s_and_don’ts_suggestions','messaging_clear_behavioral_commitments','messaging_payment_timeline_from_the_invoice',
  ],
};

/** -----------------------------
 * Helper functions
 * ----------------------------- */
function buildBlockFromQuestion(q) {
  const block_id = `${q.id}_block`;
  let element;
  if (q.type === 'static_select') {
    element = {
      type: 'static_select',
      action_id: q.id,
      options: q.options.map(o => ({ text: { type: 'plain_text', text: o }, value: o })),
      placeholder: { type: 'plain_text', text: 'Select…' },
    };
  } else if (q.type === 'multi_static_select') {
    element = {
      type: 'multi_static_select',
      action_id: q.id,
      options: q.options.map(o => ({ text: { type: 'plain_text', text: o }, value: o })),
      placeholder: { type: 'plain_text', text: 'Select one or more…' },
    };
  } else if (q.type === 'plain_text_input') {
    element = { type: 'plain_text_input', action_id: q.id };
  }
  return { type: 'input', block_id, label: { type: 'plain_text', text: q.label }, element };
}

function buildComplexityBlock(service) {
  return {
    type: 'input',
    block_id: `${service.toLowerCase()}_complexity_level_block`,
    label: { type: 'plain_text', text: `${service}: Complexity Level` },
    element: {
      type: 'static_select',
      action_id: 'complexity_level',
      options: [
        { text: { type: 'plain_text', text: 'Light' }, value: 'Light' },
        { text: { type: 'plain_text', text: 'Medium' }, value: 'Medium' },
        { text: { type: 'plain_text', text: 'Large' }, value: 'Large' },
        { text: { type: 'plain_text', text: 'Extra Large' }, value: 'Extra Large' },
      ],
    },
  };
}

/** -----------------------------
 * Slack app
 * ----------------------------- */
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

app.command('/service', async ({ ack, body, client }) => {
  await ack();
  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'service_intro_modal',
      title: { type: 'plain_text', text: 'Project Kickoff' },
      submit: { type: 'plain_text', text: 'Next' },
      close: { type: 'plain_text', text: 'Cancel' },
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: 'Submitting Details' } },
        {
          type: 'input',
          block_id: 'company_name_block',
          label: { type: 'plain_text', text: 'Company Name' },
          element: { type: 'plain_text_input', action_id: 'company_name' },
        },
        {
          type: 'input',
          block_id: 'project_name_block',
          label: { type: 'plain_text', text: 'Project Name' },
          element: { type: 'plain_text_input', action_id: 'project_name' },
        },
        {
          type: 'input',
          block_id: 'date_block',
          label: { type: 'plain_text', text: 'Date' },
          element: { type: 'datepicker', action_id: 'date' },
        },
        {
          type: 'input',
          block_id: 'services_block',
          label: { type: 'plain_text', text: 'Services We Offer' },
          element: {
            type: 'multi_static_select',
            action_id: 'services',
            options: SERVICE_OPTIONS,
          },
        },
      ],
    },
  });
});

app.view('service_intro_modal', async ({ ack, view }) => {
  const values = view.state.values;
  const companyName = values.company_name_block.company_name.value;
  const projectName = values.project_name_block.project_name.value;
  const date = values.date_block.date.selected_date;
  const selectedServices = values.services_block.services.selected_options.map(opt => opt.value);

  if (!companyName || !projectName || !date || selectedServices.length === 0) {
    await ack({ response_action: 'errors', errors: { company_name_block: 'Missing fields' } });
    return;
  }

  const blocks = [
    { type: 'section', text: { type: 'mrkdwn', text: `*Company:* ${companyName}\n*Project:* ${projectName}\n*Date:* ${date}\n*Services:* ${selectedServices.join(', ')}` } },
  ];

  selectedServices.forEach(svc => {
    blocks.push({ type: 'divider' });
    blocks.push({ type: 'header', text: { type: 'plain_text', text: `${svc} · Complexity` } });
    blocks.push(buildComplexityBlock(svc));
  });

  await ack({
    response_action: 'update',
    view: {
      type: 'modal',
      callback_id: 'service_details_modal',
      title: { type: 'plain_text', text: 'Service Details' },
      submit: { type: 'plain_text', text: 'Submit' },
      close: { type: 'plain_text', text: 'Cancel' },
      private_metadata: JSON.stringify({ companyName, projectName, date, selectedServices }),
      blocks,
    },
  });
});

app.view('service_details_modal', async ({ ack, view, body }) => {
  await ack();
  const { companyName, projectName, date, selectedServices } = JSON.parse(view.private_metadata || '{}');
  const values = view.state.values;

  const result = {
    user: body.user.id,
    company_name: companyName,
    project_name: projectName,
    date,
    selected_services: selectedServices,
    service_details: {},
  };

  // Read per-service complexity
  const complexityMap = {};
  selectedServices.forEach(service => {
    const blockId = `${service.toLowerCase()}_complexity_level_block`;
    const complexity = values[blockId]?.complexity_level?.selected_option?.value || null;
    result.service_details[service] = { complexity_level: complexity };
    complexityMap[service] = complexity;
  });

  // Read all visible questions
  COMMON_QUESTIONS.forEach(q => {
    const blockId = `${q.id}_block`;
    if (!values[blockId]) return;
    const el = values[blockId][q.id];
    let answer = q.type === 'static_select' ? el?.selected_option?.value : el?.value;

    selectedServices.forEach(svc => {
      if (svc === 'Messaging') {
        const allowed = MESSAGING_COMPLEXITY_QUESTIONS[complexityMap[svc]] || [];
        if (!allowed.includes(q.id)) return;
      }
      if (!q.appliesTo.includes(svc)) return;
      if (!result.service_details[svc]) result.service_details[svc] = {};
      result.service_details[svc][q.id] = answer;
    });
  });

  try {
    const r = await fetch('https://n8n.sitepreviews.dev/webhook/b9223a9e-8b4a-4235-8b5f-144fcf3f27a4', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });
    console.log('Webhook:', await r.text());
  } catch (e) {
    console.error('Webhook error:', e);
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Slack Bolt app running!');
})();
