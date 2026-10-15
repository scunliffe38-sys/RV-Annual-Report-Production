// CHAIR'S REPORT — INPUT FILE
//
// The copy below is taken verbatim from the supplied Word document. Paragraphs
// flow automatically across the three columns of the spread (one on the left
// page, two on the right), so you can edit, add or remove paragraphs freely —
// the split points are recalculated at build time, not hard-coded.
//
// HOW TO UPDATE FOR FY26
//   1. Replace meta.year / meta.folios / meta.signatory as needed.
//   2. Replace the paragraphs array with the new report copy, one string per
//      paragraph, in order. Keep the closing salutation as the last entry.
//   3. Drop the portrait and signature images into the two slots on the page.
//
// If the new copy runs longer than the three columns hold, the build reports
// the overflow in the browser console rather than silently clipping it.

export const chairReport = {
  meta: {
    heading: 'Chair\u2019s Report',
    signatory: 'Tim Eddy',
    signatoryRole: 'Chair',
    footYear: 2025,
    folioLeft: 4,
    folioRight: 5,
  },

  paragraphs: [
    'I am pleased to present to you Racing Victoria\u2019s (RV) 2025 Annual Report, which gives a detailed oversight of the company\u2019s key metrics during the 2024-25 Financial Year (FY25) and also provides a broader view of the performance of the Victorian Thoroughbred Racing Industry (VTRI) across the 12-month period.',
    'The period was a substantive one as we transitioned away from our historic Joint Venture agreement with Tabcorp, which had underpinned our funding for decades, to a new model which continues to recognise our industry\u2019s significant contribution to the state.',
    'Our new funding arrangements include an increased allocation of Point of Consumption Taxes (PoCT) and a fixed annual contribution from the State Government in recognition of the changes initiated with the new Victorian Wagering Licence.',
    'This investment in thoroughbred racing helps our industry support 25,700 full-time equivalent jobs and delivers $3.4 billion in value to the Victorian economy each year.',
    'Whilst these new arrangements provide future certainty, the transition in funding models and the impact of the broader economy on all forms of wagering meant that FY25 ultimately resulted in a small budgeted deficit for RV.',
    'It was a period in which we prioritised the maintenance of returns to industry, whilst working to implement a business-wide efficiency program to sustain that.',
    'That strategy continues into FY26 where our efforts to further reduce costs and create efficiencies, such as bringing our media businesses, headlined by Racing.com, back into the RV management structure will continue to materialise.',
    'In August 2024, we appointed Aaron Morrison as our Chief Executive Officer after a four-month interim period and an extended period prior as our Chief Financial and Chief Operating Officer.',
    'This move was complemented by an Executive Team restructure which saw Vaughn Lynch, Peter Betson and Andy Hoad join the business thereafter, whilst Janelle Helleur was promoted from within.',
    'Aaron, with the support of the Board and his Executive Team, has made it a clear priority for the business to strengthen our relationships with stakeholders and participants, and this renewed focus on those within our industry has been well received.',
    'This has led to better collaboration and communication across the industry which will benefit Victorian racing as we strive to maximise engagement in the highly competitive sports and entertainment market.',
    'As part of this, the Board and Aaron established a Racing Sub-Committee with accompanying Racing Forums, which have provided the platform for industry leaders to share ideas and work together collaboratively on key decisions and initiatives around our racing program.',
    'In his CEO\u2019s Report, Aaron provides a detailed overview of our financial results and outlines the areas which will be a focus for the business into FY26 as we work towards returning to break-even, whilst maintaining important industry priority investment.',
    'Reflecting on 2024-25, I would like to acknowledge the standout performers on our racetracks headlined by Blake Shinn, who claimed a third successive Scobie Breasley Medal, and Via Sistina, who was crowned the 2025 Victorian Horse of the Year. Her track record win in the 2024 Cox Plate is a memory that will live long for many.',
    'The Caulfield and Melbourne Cups in the spring of 2024 both delivered fairytale results for their jockeys Harry Coffey (Duke De Sessa) and Robbie Dolan (Knight\u2019s Choice). Both riders have unique stories that captured the hearts of the community and showed that hard work and perseverance do reap rewards.',
    'I want to pay tribute to my Deputy Chair Sharon McCrohan who has been an invaluable member of the RV Board over an eight-year term concluding in September 2025. Sharon played an instrumental role in helping ensure the continuation of Victorian racing throughout the COVID pandemic, for which the industry is forever grateful.',
    'Whilst on the theme of retirements, I want to acknowledge the significant contribution that Robbie Griffiths has made as President of the Australian Trainers Association over the past decade. We look forward to working closely with his successor Troy Corstens.',
    'I also want to acknowledge and thank the Minister for Racing, The Hon. Anthony Carbines, and Shadow Minister for Racing, The Hon. Tim Bull, who care greatly about the future of Victorian racing and continue to be great advocates for the industry.',
    'The Government\u2019s support through the Victorian Racing Industry Fund (VRIF) and Major Racing Events Fund (MREF) helps key projects and initiatives around major events, horse and participant welfare, tracks and racing facilities become reality and for that we are immensely grateful.',
    'MREF helped grow attendances at race meetings across the state and allowed clubs to better showcase our world class racing to more Victorians and visitors. This in turn helped the 2024 Spring Racing Carnival generate $785 million in economic benefit for Victoria.',
    'I\u2019d like to take this opportunity to thank my fellow Board members, Aaron and his Executive Team, and all the staff across the RV Group for their outstanding efforts and contributions over the past 12 months.',
    'I\u2019d also like to acknowledge all of our metropolitan and country clubs who once again did an amazing job putting on the show and uniting communities with great hospitality and entertainment to complement the racing action.',
    'Finally, I\u2019d like to thank all the owners, trainers, jockeys and punters who have supported Victorian racing throughout the period. Whilst there is often a spotlight on what happens off the track, it is what happens on it that will always be the magic that captivates us all and drives our industry forward.',
    'Yours sincerely,',
  ],
};
