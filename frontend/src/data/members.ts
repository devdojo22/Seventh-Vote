import { memberListSchema } from '@/types/member';

const rawMembers = [
  {
    id: 'rhonda-logan',
    bio: 'Director of Operations for Breath of Life Christian Center (also served as its Community Engagement Officer); previously Executive Director of the Raleigh Community Development Corporation. Holds a BA in Psychology from the University of Memphis and an MS in Clinical Mental Health Counseling from Freed-Hardeman University; Leadership Memphis 2021 alum and 2021 Memphis Business Journal Power 100 honoree. Elected to the council November 14, 2019 after a protracted 2019 appointment fight, and re-elected in 2023 with 76% of the vote.',
    committees: {
      'Aging Commission': 'Council Liaison',
      'Housing & Community Development Committee': 'Chair (2026)',
      'Memphis Housing Authority Board': 'Council Liaison',
      'Parks & Environment Committee': 'Vice Chair (2026)',
    },
    data_gaps: [
      'No verified roll-call votes found on the FY25, FY26, or FY27 budgets or on tax-rate ordinances; her budget/tax posture is unverified.',
      'Her data-center position rests on one Sept. 15, 2026 Planning and Zoning Committee statement; no recorded floor vote on Ordinance 5982 is available, so this remains a modest-confidence signal rather than a commitment.',
      'Committee roles before 2026 (e.g., earlier reports listing her as Public Safety chair) could not be reconciled year-by-year; 2026 assignments are from official agendas.',
      'Only one verified direct quote from the public record was found; her meeting-floor speaking style is thinly documented in text sources.',
    ],
    district: 'District 1',
    issue_positions: {
      economic_development_pilots: {
        evidence:
          "At the Sept. 15, 2026 Planning and Zoning Committee meeting, Logan said she was 'not opposed to a moratorium or data centers' and wanted better zoning for how data centers are regulated and located.",
        source_name:
          'The Commercial Appeal — Memphis City Council delays moratorium on data centers',
        source_url:
          'https://www.commercialappeal.com/story/news/local/2026/09/15/memphis-data-center-moratorium-delayed-by-memphis-city-council/91759385007/',
        stance:
          'Leaning support for a temporary moratorium as a route to better zoning and siting rules, while remaining open to data centers. Modest confidence: this is one committee statement, not a locked vote.',
      },
      education_youth: {
        evidence:
          'Personally requested the UofM School of Public Health start public health clubs at Craigmont and Raleigh-Egypt High Schools (Oct 2025).',
        source_name: 'University of Memphis School of Public Health',
        source_url:
          'https://www.memphis.edu/publichealth/news/2025/1008-sph-raleigh-meet-steve.php',
        stance:
          'Invests in youth health and opportunity as crime prevention; uses her council platform to bring university resources into District 1 schools.',
      },
      housing: {
        evidence:
          "Appeared with Mayor Young at the Hub North/Hospitality Hub groundbreaking in New Chicago (District 1 area); requested a formal update on the Mayor's housing initiative in her July 2026 committee.",
        source_name: 'Rep. Steve Cohen e-newsletter; Memphis City Council committee agenda',
        source_url:
          'http://cohen.house.gov/media-center/enewsletters/breaking-ground-hub-north-housing-new-chicago',
        stance:
          'Housing is her signature portfolio as chair of the Housing & Community Development Committee; she frames housing work as community restoration, not just unit counts. She champions faith-based and nonprofit housing providers (e.g., Hospitality Hub) and serves as liaison to the Memphis Housing Authority Board.',
      },
      neighborhoods_services: {
        evidence:
          "Monthly Raleigh Joint Agency partnership meetings, co-sponsored by the council and Mayor's Office, focus on crime and blight concerns in northeast Memphis (Oct 2025).",
        source_name: 'University of Memphis School of Public Health',
        source_url:
          'https://www.memphis.edu/publichealth/news/2025/1008-sph-raleigh-meet-steve.php',
        stance:
          'Deep Raleigh/Frayser neighborhood focus; runs the Raleigh Police Joint Agency, a collaborative crime-prevention partnership between public agencies and residents. Advocates for greenspace (former board president of Friends of Kennedy Park, a 260-acre greenspace) and created a local farmers market.',
      },
      public_safety: {
        evidence:
          'Chairs the Raleigh Police Joint Agency, a collaborative partnership of public agencies and residents planning crime prevention and improving community conditions.',
        source_name: 'City of Memphis, District 1 page (memphistn.gov)',
        source_url: 'https://memphistn.gov/city_council/district-1/',
        stance:
          'Treats public safety as a community-partnership problem (Raleigh Police Joint Agency chairwoman) rather than purely a policing problem, and connects it to youth opportunity and public health.',
      },
    },
    key_votes: [
      {
        id: 'rhonda-logan-vote-1',
        date: '2026-09-15',
        item: 'Planning and Zoning Committee discussion of the proposed data-center moratorium and future zoning rules',
        position:
          'Leaning support signal — said she was not opposed to a moratorium or data centers and called for better zoning; no floor vote recorded',
        source_name:
          'The Commercial Appeal — Memphis City Council delays moratorium on data centers',
        source_url:
          'https://www.commercialappeal.com/story/news/local/2026/09/15/memphis-data-center-moratorium-delayed-by-memphis-city-council/91759385007/',
      },
      {
        id: 'rhonda-logan-vote-2',
        date: '2025-04-08 (meeting; item reported April 2025)',
        item: 'Resolution approving $820,000 sale of Plant Road parcel to support xAI gray-water facility',
        position: 'Abstain',
        source_name: 'Citizen Portal (AI-generated meeting summary)',
        source_url:
          'https://citizenportal.ai/articles/6124779/Memphis-City/Shelby-County/Tennessee/Memphis-City-Council-approves-820000-sale-of-Plant-Road-parcel-amid-community-concerns-over-XAI-data-center-and-water-use',
      },
      {
        id: 'rhonda-logan-vote-3',
        date: '2026-07-07',
        item: "Requested formal presentation and update on the Mayor's housing initiative in the Housing & Community Development Committee",
        position: 'public position (committee leadership action)',
        source_name: 'Memphis City Council committee agenda, memphistn.gov',
        source_url:
          'https://memphistn.gov/wp-content/uploads/2026/07/Committee-agenda-7.7.26-Revised-07.07.2026-1.pdf',
      },
      {
        id: 'rhonda-logan-vote-4',
        date: '2025-10-08',
        item: 'Requested University of Memphis School of Public Health establish public health clubs at Craigmont and Raleigh-Egypt High Schools',
        position: 'public position',
        source_name: 'University of Memphis School of Public Health news',
        source_url:
          'https://www.memphis.edu/publichealth/news/2025/1008-sph-raleigh-meet-steve.php',
      },
      {
        id: 'rhonda-logan-vote-5',
        date: '2020 (planning & zoning committee)',
        item: "Resolution to rename a stretch of Poplar Avenue 'Black Lives Matter Avenue' (with amendment adding John Lewis honor)",
        position: 'Abstain (in committee; 8-4 vote)',
        source_name: 'Memphis Flyer',
        source_url:
          'https://www.memphisflyer.com/council-committee-approves-black-lives-matter-renaming',
      },
      {
        id: 'rhonda-logan-vote-6',
        date: '2023 (campaign period)',
        item: "Created the 'Code Green' anti-blight/code-enforcement program for District 1",
        position: 'public position (sponsor/creator)',
        source_name: "Memphis Flyer ('In Their Own Words II')",
        source_url: 'https://www.memphisflyer.com/in-their-own-words-ii',
      },
    ],
    leadership_role: 'none (committee chair only)',
    mayor_alignment:
      "Cooperative with Mayor Paul Young's administration on neighborhood and housing initiatives. Evidence: Logan's Raleigh Joint Agency (Police Joint Agency) partnership meetings are jointly sponsored by the Memphis City Council and the Memphis Mayor's Office (Oct 2025), and she appeared alongside Mayor Young at the Hub North/Hospitality Hub groundbreaking in District 1 (Rep. Steve Cohen's newsletter). No record found of her publicly opposing Young administration priorities.",
    name: 'Rhonda Logan',
    notable_quotes: [
      {
        id: 'rhonda-logan-quote-1',
        quote: 'As everyone works on their portion collectively, we come together.',
        source_name:
          'Memphis Daily News / ndinsider.com (on the Memphis 3.0 planning process, as Raleigh CDC executive director)',
        source_url:
          'https://www.ndinsider.com/story/news/2019/01/31/memphis-3-0-plan-build-up-not-out-starts-path-to-city-council-adoption/2720261002/',
      },
      {
        id: 'rhonda-logan-quote-2',
        quote:
          'unverified — no second direct quote found in 2024-2026 public record; see data_gaps',
        source_name: 'unverified',
        source_url: 'unverified',
      },
    ],
    opposition_triggers: [
      'Items that bypass neighborhood-level engagement in District 1 (inferred from her organizing background)',
      'Symbolic or divisive measures where she perceives procedural unfairness (she abstained on the BLM street-renaming committee vote amid an amendment dispute)',
      'Development deals with unclear community benefit (she abstained rather than approve the xAI parcel sale)',
    ],
    persuasion_levers: [
      'Demonstrated neighborhood impact in Raleigh/Frayser with community partners at the table',
      'Faith-based and nonprofit delivery partners (Hospitality Hub model)',
      "Data tied to blight reduction and code enforcement outcomes (her 'Code Green' program)",
      'Youth and family framing',
    ],
    political_style:
      "Neighborhood advocate and community-development practitioner. Approaches council work as an organizer and nonprofit executive: solutions-oriented, faith-inflected, focused on restoring 'broken or damaged lives, dreams, and paths' in north Memphis neighborhoods like Raleigh and Frayser.",
    took_office: '2020 (elected November 14, 2019; re-elected 2023)',
    twin_voice:
      "Warm, faith-inflected, and organizer-like: speaks in terms of restoration, collaboration, and bringing order to challenges. Rarely combative on the record; prefers to convene stakeholders rather than grandstand. Example: describing the Memphis 3.0 neighborhood planning process, she said, 'As everyone works on their portion collectively, we come together' — collective, process-positive framing typical of her public remarks.",
    voting_bloc:
      'unknown — roll-call evidence is thin; most of her recorded actions are committee leadership items and unanimous consent votes. She abstained on the xAI Plant Road parcel sale (April 2025) while most colleagues voted yes.',
  },
  {
    id: 'jerri-green',
    bio: "Attorney and former juvenile public defender (Nashville) and executive director of the Community Legal Center; served five years as senior policy advisor and then deputy chief of staff to Shelby County Mayor Lee Harris. BA in English and Political Science from UT-Knoxville, JD from Georgetown Law. First Democrat to hold the District 2 seat; her 2023 runoff win helped usher in the council's first female majority. On August 6, 2026 she won the Democratic primary for Tennessee governor with ~69% of the vote and is the party's nominee facing Republican Marsha Blackburn in the November 3, 2026 general election.",
    committees: {
      'Economic Development, Tourism, & Technology Committee':
        'Former Committee Chair (2024-2025; 2026 assignment unverified)',
      'Transportation Committee': 'Vice Chair (2025; 2026 unverified)',
    },
    data_gaps: [
      'Her 2026 committee assignments could not be verified (2024-2025 roles sourced from Change.org bio and 2025 agendas).',
      'Exact roll-call votes on FY25/FY26/FY27 budgets are unverified; positions are drawn from sponsorship and quotes.',
      'Citizen Portal summaries used for two items are AI-generated; vote tallies there should be cross-checked against official minutes.',
      'Her council attendance/engagement level since winning the gubernatorial primary (Aug 2026) is unverified.',
    ],
    district: 'District 2',
    issue_positions: {
      budget_taxes: {
        evidence:
          "Her June 2025 $66.44M budget amendment package (state-tax projections, XAI-related receipts, court receipts, vacancy savings) was accepted for debate over Mayor Young's objections.",
        source_name: 'Citizen Portal (AI-generated meeting summary)',
        source_url:
          'https://citizenportal.ai/articles/6231500/Memphis-City/Shelby-County/Tennessee/Council-committee-accepts-Councilwoman-Greens-6644-million-operating-budget-amendment-for-further-review',
        stance:
          'Fiscal watchdog who hunts for revenue and savings before supporting tax increases. Proposed tapping $265M+ in outstanding citations since 1991 and $66.44M in vacancy/hiring-control savings rather than raise property taxes; pushes conservative revenue estimates and fund-balance protection.',
      },
      economic_development_pilots: {
        evidence:
          'Named with JB Smiley Jr., Jana Swearengen-Washington, and Dr. Michalyn Easter-Thomas as a sponsor in the pre-final ordinance draft published Aug. 31, 2026; she has also publicly objected to being left in the dark on data-center development.',
        source_name:
          'Published pre-final ordinance draft shared by @jbsmileyjr on Instagram, Aug. 31, 2026',
        source_url: '',
        stance:
          'Strong support signal for the temporary moratorium and for using the pause to demand transparency, enforceable safeguards, and community benefit. Sponsorship is not certainty under Rule 23.',
      },
      education_youth: {
        evidence:
          "Campaign bio credits her with putting 'more kids in pre-K and youth programming' and championing youth mental health.",
        source_name: 'Nashville Banner (candidate profile)',
        source_url: 'http://nashvillebanner.com/2026/07/16/jerri-green-tn-gov-campaign/',
        stance:
          "Youth investment as both moral and crime-prevention strategy: pre-K expansion, youth programming, in-precinct youth counselors; campaign platform centers 'world-class public schools' and paid family leave.",
      },
      mlgw_utilities: {
        evidence:
          "'I will use data to make sure MLGW has a robust tree trimming program that targets the areas most susceptible to power outages... It is time to hold the leadership accountable.'",
        source_name: "Memphis Flyer ('In Their Own Words')",
        source_url: 'https://www.memphisflyer.com/in-their-own-words',
        stance:
          'Wants MLGW held accountable with data: a robust, targeted tree-trimming program aimed at outage-prone areas, and utility improvements that align with what customers are charged.',
      },
      public_safety: {
        evidence:
          "November 2024 resolution expanding mental-health treatment eligibility for officers who witness violence; as Harris advisor she started the nation's first free gun-lock-by-mail program by a local government.",
        source_name: 'Commercial Appeal (beaconjournal.com); Memphis Flyer',
        source_url:
          'https://www.beaconjournal.com/story/news/local/2025/07/14/memphis-city-councilwoman-jerri-tennessee-governor/85191204007/',
        stance:
          'Pro-reform public-safety pragmatist: backs first responders with better benefits while pushing data-driven prevention (gun locks, youth counselors, ex-offender jobs). Led expansion of mental-health care for officers exposed to trauma.',
      },
    },
    key_votes: [
      {
        id: 'jerri-green-vote-1',
        date: '2024-05',
        item: 'Proposed one-month citation-abatement program (with Smiley, Swearengen-Washington, Easter-Thomas, Warren) to raise revenue and avoid a property tax increase',
        position: 'public position (sponsor)',
        source_name: 'Commercial Appeal (beaconjournal.com)',
        source_url:
          'https://www.beaconjournal.com/story/news/politics/2024/05/27/memphis-city-council-unions-budget/73632267007/',
      },
      {
        id: 'jerri-green-vote-2',
        date: '2025-06',
        item: '$66.44 million operating-budget amendment (revenue increases, vacancy savings, hiring controls)',
        position: 'public position (sponsor; accepted for debate, final vote delayed)',
        source_name: 'Citizen Portal (AI-generated meeting summary)',
        source_url:
          'https://citizenportal.ai/articles/6231500/Memphis-City/Shelby-County/Tennessee/Council-committee-accepts-Councilwoman-Greens-6644-million-operating-budget-amendment-for-further-review',
      },
      {
        id: 'jerri-green-vote-3',
        date: '2024-11',
        item: 'Resolution expanding mental-health care access for police officers who witness traumatic incidents (previously only physically injured officers qualified)',
        position: 'public position (led passage)',
        source_name: 'Commercial Appeal (beaconjournal.com)',
        source_url:
          'https://www.beaconjournal.com/story/news/local/2025/07/14/memphis-city-councilwoman-jerri-tennessee-governor/85191204007/',
      },
      {
        id: 'jerri-green-vote-4',
        date: '2026-08-31',
        item: 'Ordinance 5982 working reference — 12-month data-center moratorium; published pre-final draft number field was blank',
        position:
          'Strong support signal (co-sponsor named in the published draft; sponsorship is not certainty under Rule 23)',
        source_name:
          'Published pre-final ordinance draft shared by @jbsmileyjr on Instagram, Aug. 31, 2026',
        source_url: '',
      },
      {
        id: 'jerri-green-vote-5',
        date: '2026-08',
        item: 'Resolution allocating ~$17 million in FY27 council community grant funds to medical-debt relief, remainder to MLGW Plus-One utility assistance',
        position: 'public position (sponsor)',
        source_name: 'Citizen Portal (AI-generated meeting summary)',
        source_url:
          'https://citizenportal.ai/articles/9456463/tennessee/shelby-county/memphis-city/memphis-council-fasttracks-17-million-medicaldebt-relief-resolution',
      },
      {
        id: 'jerri-green-vote-6',
        date: '2026-09-02',
        item: 'Resolution renaming Union Avenue (Dunlap to Manassas) to honor former Shelby County Mayor Lee Harris',
        position: 'public position (spearheaded; passed with pushback from Warren and Ford Sr.)',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/news/politics/2026/09/02/mlgw-storm-cleanup-cost-estimate/91515532007/',
      },
    ],
    leadership_role: 'none (committee chair only)',
    mayor_alignment:
      "Independent — willing to publicly challenge the Young administration, especially on budgets. Evidence: her $66.44 million FY2026 operating-budget amendment was opposed in committee by Mayor Young himself, who said he was 'not supportive of moving some committed funds back to reserves'; in 2024 she pushed a citation-abatement program explicitly to avoid Young's proposed 75-cent property tax hike.",
    name: 'Jerri Green',
    notable_quotes: [
      {
        id: 'jerri-green-quote-1',
        quote: 'No more stepping on us without talking to us.',
        source_name: 'Commercial Appeal (data-center committee session, Aug 18, 2026)',
        source_url:
          'https://www.commercialappeal.com/story/money/business/development/2026/08/18/memphis-chamber-opposes-data-center-moratorium-says-city-will-lose-leverage-in-statement/91362036007/',
      },
      {
        id: 'jerri-green-quote-2',
        quote: 'We showed up where politicians have stopped showing up.',
        source_name:
          'The Tennessean (Democratic gubernatorial primary victory speech, Aug 6, 2026)',
        source_url:
          'https://www.tennessean.com/story/news/politics/elections/2026/08/06/governor-primary-election-results-blackburn-rose-green/91095462007/',
      },
    ],
    opposition_triggers: [
      "Budget proposals that move committed funds or rely on optimistic revenue without data (she challenged Young's FY26 amendment response directly)",
      "Being blindsided by administration or corporate announcements ('We too learned in the newspaper')",
      'Tax increases proposed before collections, vacancies, and efficiency savings are exhausted',
    ],
    persuasion_levers: [
      'Hard numbers: audits, collection rates, vacancy data, ROI analysis',
      'Equity framing backed by data (who pays, who benefits)',
      "Policy precedents from other cities (she cites 'nation's first' programs)",
      'First-responder and working-family beneficiaries',
    ],
    political_style:
      "Data-driven policy wonk and fiscal reformer. Leads with numbers, audits, and program design (gun-lock-by-mail, citation collections); comfortable challenging the mayor's math in public and framing herself as the adult in the room on budgets.",
    took_office: '2024 (elected in November 2023 runoff; sworn in January 2024)',
    twin_voice:
      "Direct, lawyerly, and numbers-first: asks pointed questions of officials, cites figures from memory, and frames arguments as common-sense accountability. Combines prosecutorial directness with campaign-style moral clarity. Example: confronting the data-center process she said, 'No more stepping on us without talking to us' — blunt, populist, and typical of how she personalizes institutional fights.",
    voting_bloc:
      'unknown — but she co-sponsors frequently with Smiley (FY27 budget amendments, data-center moratorium, 2024 citation abatement), suggesting a reform-oriented working alignment with him.',
  },
  {
    id: 'pearl-eva-walker',
    bio: "Founder and executive director of the I Love Whitehaven Neighborhood and Business Association; Environmental and Climate Justice Chair of the Memphis NAACP; civic-engagement consultant for a clean-energy group (Southern Alliance for Clean Energy). BA in African-American Studies (race relations/interracial communication) from the University of Memphis; co-host of the '901 Voices and Votes' podcast and founder of the 'Memphis Raise Your Expectations' (MRYE) Facebook group. Took the District 3 seat in the 2023 runoff, succeeding Patrice Robinson.",
    committees: {
      'MLGW Committee': 'Chair (as of January 2026)',
      'MLGW Fiscal Consent': 'Vice Chair (January 2025)',
    },
    data_gaps: [
      'Her positions on the FY25-FY27 budgets, tax rates, and transit are unverified.',
      'Her vote on the 2026 data-center moratorium itself is unverified (she supported the Cooper-Sutton regulatory ordinance in May 2026).',
      "Citizen Portal summaries used for two items are AI-generated and mangle names ('Pearl Iba Walker'); tallies should be cross-checked against official minutes.",
      'Whether she still chairs the MLGW committee as of September 2026 is unverified beyond the January 2026 board minutes.',
    ],
    district: 'District 3',
    issue_positions: {
      economic_development_pilots: {
        evidence:
          "Her 1% environmental-education floor amendment to the AI tax-revenue ordinance (Aug 2025): 'I believe a 1% floor is modest, measurable, and accountable.'",
        source_name: 'Citizen Portal (AI-generated meeting summary)',
        source_url:
          'https://citizenportal.ai/articles/6585216/Memphis-City/Shelby-County/Tennessee/Memphis-Council-approves-ordinance-enabling-AI-property-tax-funds-for-community-benefits-adds-1-education-requirement',
        stance:
          'Supports industry and jobs in principle but demands enforceable community benefits, environmental education funding, and regulatory guardrails — especially for data centers in Southwest Memphis/Whitehaven.',
      },
      mlgw_utilities: {
        evidence:
          "In Nov 2022 (pre-council) she urged the MLGW board to reject the 'neverending' TVA contract, citing high energy burdens on poor and fixed-income households; in Jan 2026 MLGW's board vice chair publicly thanked her for 'stepping up and chairing the MLGW Committee.'",
        source_name: 'MLGW board minutes (Nov 2022; Jan 7, 2026)',
        source_url: 'https://www.mlgw.com/images/content/files/board_meeting/jan726.pdf',
        stance:
          'Energy-burden and clean-energy advocate: opposes locking customers into volatile fossil-fuel costs and pushes MLGW toward greener, more accountable power planning. As MLGW committee chair she works directly with utility leadership while pressing from the community side.',
      },
      neighborhoods_services: {
        evidence:
          "TN Senate Resolution 242 honors her as founder/executive director of the I Love Whitehaven Neighborhood and Business Association 'which supports small local businesses.'",
        source_name: 'TN Senate Resolution 242 (billcam.com)',
        source_url: 'https://billcam.com/bill-texts/SgLH2n2zRv',
        stance:
          "Whitehaven-first neighborhood builder: founded the I Love Whitehaven Neighborhood and Business Association to support small local businesses and civic life in District 3, which contains some of the city's highest-crime zip codes.",
      },
      public_safety: {
        evidence:
          'Co-chair of the Memphis NAACP environmental and climate justice committee; pressed for air-quality and water answers on xAI facilities.',
        source_name: 'MLGW board minutes (Aug 2024)',
        source_url:
          'https://www.mlgw.com/images/content/files/board_meeting/BMSigned8212024_001.pdf',
        stance:
          'Frames environmental harm as a public-health and safety issue for Southwest Memphis/Boxtown; less on record about policing specifically.',
      },
    },
    key_votes: [
      {
        id: 'pearl-eva-walker-vote-1',
        date: '2025-04-08 (meeting; item reported 2025)',
        item: 'Resolution approving $820,000 sale of Plant Road parcel to support xAI gray-water facility',
        position: 'Yes (with public demand for accountability and safety assurances)',
        source_name: 'Citizen Portal (AI-generated meeting summary)',
        source_url:
          'https://citizenportal.ai/articles/6124779/Memphis-City/Shelby-County/Tennessee/Memphis-City-Council-approves-820000-sale-of-Plant-Road-parcel-amid-community-concerns-over-XAI-data-center-and-water-use',
      },
      {
        id: 'pearl-eva-walker-vote-2',
        date: '2025-08-19',
        item: 'Amendment to Ordinance No. 5953 (AI property-tax community-benefit allocation) requiring at least 1% for community environmental education and outreach',
        position: 'Yes (sponsor of amendment)',
        source_name: 'Citizen Portal (AI-generated meeting summary)',
        source_url:
          'https://citizenportal.ai/articles/6585216/Memphis-City/Shelby-County/Tennessee/Memphis-Council-approves-ordinance-enabling-AI-property-tax-funds-for-community-benefits-adds-1-education-requirement',
      },
      {
        id: 'pearl-eva-walker-vote-3',
        date: '2025-04-08',
        item: 'Resolution to amend the FY25 council community grant allocations',
        position: 'public position (sponsor)',
        source_name: 'Memphis City Council minutes, memphistn.gov',
        source_url: 'http://memphistn.gov/wp-content/uploads/2025/04/Minutes-04-08-25.pdf',
      },
      {
        id: 'pearl-eva-walker-vote-4',
        date: '2025-10-21',
        item: 'Resolution amending the application period for the FY26 council community grant program',
        position: 'public position (sponsor)',
        source_name: 'Memphis City Council minutes, memphistn.gov',
        source_url: 'https://memphistn.gov/wp-content/uploads/2025/10/Minutes-10-21-2025.pdf',
      },
      {
        id: 'pearl-eva-walker-vote-5',
        date: '2026-05-06',
        item: "Voiced support in executive session for Cooper-Sutton's data-center environmental regulations ordinance (daily fines, permit sunset provisions)",
        position: 'public position',
        source_name: 'Commercial Appeal (beaconjournal.com)',
        source_url:
          'https://www.beaconjournal.com/story/money/business/2025/06/02/regulations-for-data-centers-in-atlanta-loudoun-county-virginia-memphis/83599231007/',
      },
      {
        id: 'pearl-eva-walker-vote-6',
        date: '2024-08-10',
        item: "Hosted at-capacity community Q&A on xAI at Southwest Tennessee Community College's Whitehaven campus",
        position: 'public position (convener)',
        source_name: 'MLGW news',
        source_url: 'https://www.mlgw.com/news/news_xai7meetinglivestreamed',
      },
    ],
    leadership_role: 'none (committee chair only)',
    mayor_alignment:
      "Cooperative on community engagement, independent on policy substance. Evidence: after voting yes on the xAI-related Plant Road parcel sale, she invited constituents to 'an upcoming forum with the mayor' on the project — working the administration channel while publicly demanding safety assurances. No record found of direct clashes with Young.",
    name: 'Pearl Eva Walker',
    notable_quotes: [
      {
        id: 'pearl-eva-walker-quote-1',
        quote:
          "We need the wastewater facility. I support the wastewater facility, but to my colleagues, y'all, people need information and we need to know that this is safe.",
        source_name: 'Citizen Portal (Plant Road parcel debate, April 2025)',
        source_url:
          'https://citizenportal.ai/articles/6124779/Memphis-City/Shelby-County/Tennessee/Memphis-City-Council-approves-820000-sale-of-Plant-Road-parcel-amid-community-concerns-over-XAI-data-center-and-water-use',
      },
      {
        id: 'pearl-eva-walker-quote-2',
        quote: 'I believe a 1% floor is modest, measurable, and accountable.',
        source_name: 'Citizen Portal (Ordinance 5953 amendment, Aug 19, 2025)',
        source_url:
          'https://citizenportal.ai/articles/6585216/Memphis-City/Shelby-County/Tennessee/Memphis-Council-approves-ordinance-enabling-AI-property-tax-funds-for-community-benefits-adds-1-education-requirement',
      },
    ],
    opposition_triggers: [
      'Environmental and health corners being cut for industrial projects in Black neighborhoods',
      "Being asked to approve projects without public information or safety answers ('people need information')",
      'Utility decisions that lock in fossil-fuel costs for low-income ratepayers',
    ],
    persuasion_levers: [
      'Enforceable environmental safeguards and monitoring',
      'Dedicated community-benefit funding (education, workforce) tied to the project',
      'Direct community engagement — forums, Q&As — before votes',
      'Data on energy burden and health impacts',
    ],
    political_style:
      'Environmental and energy-justice advocate turned legislator. Leads with community health, pollution, and utility-burden impacts on Black and low-income neighborhoods; pairs activist pressure with detailed policy amendments (e.g., the 1% environmental-education floor).',
    took_office: '2024 (elected in November 2023 runoff; sworn in January 2024)',
    twin_voice:
      "Plainspoken, moral, and community-rooted: speaks as a neighbor and advocate ('to my colleagues, y'all'), centers the people living nearest a project, and pairs support with conditions. Comfortable with policy detail (amendment language) but always returns to information and safety for residents. Example: 'We need the wastewater facility. I support the wastewater facility, but to my colleagues, y'all, people need information and we need to know that this is safe.'",
    voting_bloc:
      'unknown — though she voted with Cooper-Sutton, Smiley, Warren, White, and Canale to hold the alcohol-code ordinance (April 8, 2025), and she seconded motions alongside Green on budget items (2025). Single data points; not a pattern.',
  },
  {
    id: 'jana-swearengen-washington',
    bio: '30-year educator: former principal, assistant principal, district curriculum specialist, and teacher in the Forrest City, Millington, and Memphis-Shelby County school districts, with expertise in organizational planning, data analysis, grant writing, and budget oversight. Member of Alpha Kappa Alpha Sorority, Glenview and Magnolia Castalia neighborhood associations, and Democratic Women of Shelby County. Council liaison to the Renasant Convention Center and EDGE (Economic Development Growth Engine). Served as council vice chair in 2025 before becoming chairwoman in January 2026.',
    committees: {
      'Executive Committee': 'Chair (2026)',
      'Planning & Zoning Committee': 'Chairwoman (October 2025)',
      'Public Services, Arts, Youth Initiatives, Libraries & Neighborhood Committee':
        'Chair (per BallotProject; year unverified)',
    },
    data_gaps: [
      'Her 2026 committee assignments beyond the Executive Committee chair are unverified (Planning & Zoning chair documented Oct 2025).',
      'Her individual positions on the FY25-FY27 budgets, tax rates, PILOTs, and transit are unverified.',
      'No record found of her speaking at length in floor debate; her style is documented mainly through press releases and newsletters.',
      'Her path onto the council in 2022 (appointment vs. special election) is unverified.',
    ],
    district: 'District 4',
    issue_positions: {
      economic_development_pilots: {
        evidence:
          'Named with JB Smiley Jr., Jerri Green, and Dr. Michalyn Easter-Thomas as a sponsor in the pre-final ordinance draft published Aug. 31, 2026.',
        source_name:
          'Published pre-final ordinance draft shared by @jbsmileyjr on Instagram, Aug. 31, 2026',
        source_url: '',
        stance:
          'Strong support signal for the temporary moratorium while permanent data-center rules are developed. Sponsorship is highly relevant public evidence, but Rule 23 means it is not a guaranteed final vote.',
      },
      education_youth: {
        evidence:
          "Ran free weekly youth haircut events with NBHDHERO at Orange Mound and Glenview community centers (2025): 'Looking and feeling your best can make a powerful difference in a child's confidence.'",
        source_name: 'City of Memphis press release (content.govdelivery.com)',
        source_url: 'https://content.govdelivery.com/accounts/TNMEMPHIS/bulletins/3f54085',
        stance:
          'Signature issue flowing from her 30-year education career: youth opportunity, confidence, and neighborhood-based programming. Partners with grassroots groups for direct services to kids.',
      },
      neighborhoods_services: {
        evidence:
          "Her March 2026 chairwoman's newsletter emphasizes 'listening, engaging residents, and strengthening partnerships that reflect the needs and aspirations of the people of Memphis.'",
        source_name: "Chairwoman's newsletter (memphistn.gov)",
        source_url:
          'https://memphistn.gov/wp-content/uploads/2024/06/JSW-AUGUST-NEWSLETTER-03.03.2026.pdf',
        stance:
          "Neighborhood-first service delivery: community facilities, park upgrades, and constituent services framed as connecting every community to the city's progress.",
      },
      public_safety: {
        evidence:
          "Jan 13, 2026 chairwoman's recap highlighted 'strengthening the Memphis Fire Department's emergency response capabilities' as a key action.",
        source_name: 'Memphis City Council YouTube',
        source_url: 'https://www.youtube.com/watch?v=dDdswzpxQZQ',
        stance:
          'Supports public-safety capacity (fire department emergency response, community facilities as safe spaces) without the confrontational posture some colleagues take toward MPD leadership.',
      },
    },
    key_votes: [
      {
        id: 'jana-swearengen-washington-vote-1',
        date: '2026-08-31',
        item: 'Ordinance 5982 working reference — 12-month data-center moratorium; published pre-final draft number field was blank',
        position:
          'Strong support signal (co-sponsor named in the published draft; sponsorship is not certainty under Rule 23)',
        source_name:
          'Published pre-final ordinance draft shared by @jbsmileyjr on Instagram, Aug. 31, 2026',
        source_url: '',
      },
      {
        id: 'jana-swearengen-washington-vote-2',
        date: '2026-08',
        item: "Moved same-night minutes to advance Green's $17M medical-debt relief resolution out of committee",
        position: 'Yes (procedural support as chairwoman)',
        source_name: 'Citizen Portal (AI-generated meeting summary)',
        source_url:
          'https://citizenportal.ai/articles/9456463/tennessee/shelby-county/memphis-city/memphis-council-fasttracks-17-million-medicaldebt-relief-resolution',
      },
      {
        id: 'jana-swearengen-washington-vote-3',
        date: '2026-07-07',
        item: 'Resolution establishing the FY27 Memphis City Council Community Grant Program (committee)',
        position: 'public position (sponsor)',
        source_name: 'Memphis City Council committee agenda, memphistn.gov',
        source_url:
          'https://memphistn.gov/wp-content/uploads/2026/07/Committee-agenda-7.7.26-Revised-07.07.2026-1.pdf',
      },
      {
        id: 'jana-swearengen-washington-vote-4',
        date: '2026-09-08',
        item: 'Co-announced Memphis Cares ($100K food assistance after severe storms/power outages) with Mayor Young and United Way',
        position: 'public position',
        source_name: 'City of Memphis press release (memphistn.gov)',
        source_url:
          'https://memphistn.gov/city-of-memphis-activates-memphis-cares-to-provide-food-assistance-following-severe-storms/',
      },
      {
        id: 'jana-swearengen-washington-vote-5',
        date: '2025-12-02',
        item: 'Building/fire code update ordinances (Nos. 5962-5964, third reading)',
        position: 'Yes (moved passage)',
        source_name: 'Memphis City Council minutes, memphistn.gov',
        source_url: 'https://memphistn.gov/wp-content/uploads/2025/12/Minutes-12-2-2025-003.pdf',
      },
      {
        id: 'jana-swearengen-washington-vote-6',
        date: '2025-03-25',
        item: '$1.5M G.O. bond appropriation for the Hospitality Hub North project (District 1)',
        position: 'Yes (moved approval)',
        source_name: 'Memphis City Council minutes, memphistn.gov',
        source_url: 'https://memphistn.gov/wp-content/uploads/2025/04/Minutes-03-25-25.pdf',
      },
    ],
    leadership_role: 'Chairwoman (since January 2026; verified still chair as of September 2026)',
    mayor_alignment:
      "Ally / constructive partner of Mayor Young's administration. Evidence: she co-announced the 'Memphis Cares' storm-relief program with Mayor Young in September 2026 ('The City administration and City Council are working together...'), and she sponsored the administration-adjacent FY27 council community grant program resolution. No record of public clashes with Young.",
    name: 'Jana Swearengen-Washington',
    notable_quotes: [
      {
        id: 'jana-swearengen-washington-quote-1',
        quote:
          "Looking and feeling your best can make a powerful difference in a child's confidence.",
        source_name:
          'City of Memphis press release on free youth haircuts with NBHDHERO (Aug 2025)',
        source_url: 'https://content.govdelivery.com/accounts/TNMEMPHIS/bulletins/3f54085',
      },
      {
        id: 'jana-swearengen-washington-quote-2',
        quote:
          'The City administration and City Council are working together with United Way of the Mid-South to help those with the highest need who were also the hardest hit by this storm.',
        source_name: 'City of Memphis press release on Memphis Cares (Sept 2026)',
        source_url:
          'https://memphistn.gov/city-of-memphis-activates-memphis-cares-to-provide-food-assistance-following-severe-storms/',
      },
    ],
    opposition_triggers: [
      'Partisan or divisive framing that undercuts council unity (inferred from her consensus-leadership branding)',
      'Items that bypass committee process (she runs a process-heavy chairmanship)',
      'Proposals lacking visible neighborhood or youth benefit',
    ],
    persuasion_levers: [
      'Youth and education impact — her core identity',
      'Neighborhood-level engagement and visible community partnerships',
      'Mayor-council partnership framing (shared credit)',
      'Orderly process: committee vetting, measurable outcomes',
    ],
    political_style:
      "Consensus-building institutionalist and education-first community advocate. Runs the council as a facilitator — community meetings, youth initiatives, neighborhood partnerships — and frames her leadership as listening and unity ('the best is yet to come').",
    took_office: '2022',
    twin_voice:
      "Warm, unifying, and educator-like: speaks in inclusive 'we' language, emphasizes listening and partnership, and avoids sharp elbows. As chair she narrates meetings as collective progress ('the best is yet to come'). Example: on storm relief she said, 'The City administration and City Council are working together with United Way of the Mid-South to help those with the highest need' — institutional, collaborative, service-oriented.",
    voting_bloc:
      'unknown — as chairwoman she moves many items procedurally; no dissent pattern documented. She co-sponsors with the reform bloc (Smiley, Green) on the moratorium while partnering with the mayor on relief programs, suggesting a bridging role.',
  },
  {
    id: 'philip-spinosa',
    bio: "Philip Spinosa, Jr. served on the Memphis City Council from 2015 to 2018 (Super District 9-2), resigned to become Senior Vice President of the Chairman's Circle at the Greater Memphis Chamber, and was elected to the District 5 seat on October 5, 2023 (8,860 votes, 54%) over Meggan Kiel, returning to the council in January 2024. Professionally he spent 15+ years at FedEx, then served as the Chamber's SVP of the Chairman's Circle, and in 2019 founded his own boutique logistics firm, Prestigious Logistics. In his first council stint he focused on public safety (Neighborhood Sentinel Program, LED streetlights), economic development, and homelessness, and he is an alumnus of Christian Brothers High School and the University of Mississippi (B.S. Business Administration/Insurance).",
    committees: {
      'Memphis, Light, Gas, and Water Committee': 'Vice Chair',
      'Planning & Zoning Committee': 'Chair',
    },
    data_gaps: [
      'Committee assignments: Chair of Planning & Zoning and Vice Chair of MLGW confirmed via the official District 5 page (https://memphistn.gov/city_council/district-5/). A May 6, 2025 council committee agenda instead listed him as Vice Chair of the Public Safety & Homeland Security Committee — assignments appear to have been revised, and the full current roster is unverified.',
      'His individual vote on the 2024 49-cent property tax increase (same budget cycle as the solid waste fee he alone opposed) is unverified.',
      'Term end date conflicts across sources: ballotproject.org lists 2024-01-01 to 2028-12-31 (https://ballotproject.org/people/M3H1jizcBZ/); the task brief says next election Oct 2027 — unverified which is authoritative.',
      'No verifiable record of positions on specific PILOTs, transit/MATA funding, or education/youth items.',
      'No direct, on-record interaction with Mayor Paul Young (public conflict or support) was found in 2024-2026 coverage.',
      "His final vote on the FY2026 budget (not just the raise amendment) and on the data center moratorium's third/final reading (Sept 2026) are unverified as of this writing.",
    ],
    district: 'District 5',
    issue_positions: {
      budget_taxes: {
        evidence:
          "Only council member to vote against the 2024 solid waste fee increase (June 2024), and one of two 'No' votes on the FY2026 amendment granting 3% raises to all city employees (June 2025).",
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.beaconjournal.com/story/news/government/city/2024/06/25/memphis-2025-budget-tax-increases/74169400007/',
        stance:
          'Fiscal conservative on resident-facing costs. Spinosa has voted against fee hikes and pay-restructuring amendments, and his record suggests skepticism of raising what residents pay directly, favoring cuts elsewhere first.',
      },
      economic_development_pilots: {
        evidence:
          "On data centers he proposed Ordinance 5985 — a tiered-review framework 'to replace a blanket data center moratorium' — and a five-piece framework covering environmental standards, ratepayer protection, aquifer security, and community benefit (Sept 2026).",
        source_name: 'Memphis Flyer',
        source_url:
          'https://www.memphisflyer.com/council-hears-data-center-guideline-proposals-as-moratorium-passes-second-reading/',
        stance:
          'Pro-growth and leverage-oriented rather than restriction-oriented. He prefers negotiated standards and community-benefit extraction from big projects over blanket bans or pauses on development.',
      },
      mlgw_utilities: {
        evidence:
          'Reported the MLGW fiscal consent slate (incl. up to $112M in transformer programs) to the council in Oct 2025; his 2026 data-center framework explicitly addresses ratepayer and infrastructure-cost protection.',
        source_name: 'Citizen Portal',
        source_url:
          'https://citizenportal.ai/articles/6719877/Memphis-City/Shelby-County/Tennessee/Council-approves-MLGW-fiscal-consent-items-including-large-transformer-and-infrastructure-contracts',
        stance:
          'Engaged utility overseer via his MLGW Committee vice chairmanship; has been a conduit for MLGW fiscal and infrastructure items to the full council and is attentive to data-center power and water demands.',
      },
      neighborhoods_services: {
        evidence:
          'Sponsored the March 2026 STR enforcement resolution after residents reported violence and property crime tied to short-term rentals; his official council page credits him with the LED streetlight implementation push.',
        source_name: 'WMC Action News 5 / City of Memphis official page',
        source_url:
          'https://www.wvlt.tv/2026/03/04/neighbors-demand-action-memphis-city-council-after-repeated-violence-short-term-rentals/',
        stance:
          'Neighborhood-level service and code-enforcement advocate, with East Memphis/Midtown District 5 concerns prominent: short-term-rental nuisance enforcement, LED streetlights, and blight-related cameras.',
      },
      public_safety: {
        evidence:
          "Lone council voice in committee on the anti-National-Guard resolution, saying the 'vast majority of Memphians' he spoke with were 'excited to have resources here' (Sept 2025).",
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.beaconjournal.com/story/news/local/2025/09/23/memphis-city-council-national-guard-resolution/86310215007/',
        stance:
          "More-resources, law-and-order posture. His signature first-term program (Neighborhood Sentinel) built the city's aerial surveillance camera network feeding MPD's Real Time Crime Center, and he defended federal law-enforcement deployments in Memphis in 2025.",
      },
    },
    key_votes: [
      {
        id: 'philip-spinosa-vote-1',
        date: '2024-06-25',
        item: 'FY2025 budget: solid waste fee increase — the only council member to vote against it (property tax also rose 49 cents in the same budget cycle).',
        position: 'No',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.beaconjournal.com/story/news/government/city/2024/06/25/memphis-2025-budget-tax-increases/74169400007/',
      },
      {
        id: 'philip-spinosa-vote-2',
        date: '2025-06-10',
        item: "FY2026 budget amendment: 3% raises for all city employees (overriding the fire department's previously planned 5% raise) — voted against alongside Councilwoman Jerri Green; the amendment passed.",
        position: 'No',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.beaconjournal.com/story/news/local/2025/06/10/memphis-city-2026-budget/84140143007/',
      },
      {
        id: 'philip-spinosa-vote-3',
        date: '2025-08',
        item: "Ordinance 5,953: redirecting property-tax revenue from AI-infrastructure parcels to community-benefit spending — recorded 'yes' on final passage of the substitute ordinance (roll call).",
        position: 'Yes',
        source_name: 'Citizen Portal',
        source_url:
          'https://citizenportal.ai/articles/6585216/Memphis-City/Shelby-County/Tennessee/Memphis-Council-approves-ordinance-enabling-AI-property-tax-funds-for-community-benefits-adds-1-education-requirement',
      },
      {
        id: 'philip-spinosa-vote-4',
        date: '2025-09-23',
        item: "Resolution asking Gov. Bill Lee not to deploy the National Guard to Memphis — the only councilperson to speak on the item in committee, saying most Memphians he talked to were 'excited to have resources here' (supportive of the deployment); missed the full-council vote for his son's football game. Resolution failed 4-4-2.",
        position: 'Absent (spoke in committee)',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.beaconjournal.com/story/news/local/2025/09/23/memphis-city-council-national-guard-resolution/86310215007/',
      },
      {
        id: 'philip-spinosa-vote-5',
        date: '2026-03-03',
        item: "Resolution to strengthen short-term-rental enforcement (sponsor) — asked the Mayor's administration to partner with an organization (e.g., SafeWays nonprofit, compliance monitoring) and report back within 90 days; noted 90% of Memphis STRs lacked permits.",
        position: 'Sponsor (public position)',
        source_name: 'WMC Action News 5 (via wvlt.tv)',
        source_url:
          'https://www.wvlt.tv/2026/03/04/neighbors-demand-action-memphis-city-council-after-repeated-violence-short-term-rentals/',
      },
      {
        id: 'philip-spinosa-vote-6',
        date: '2026-09-01',
        item: "Data center moratorium (Ord. 5982) vs. alternative framework (Ord. 5985) — introduced a 'pathway' resolution and Ordinance 5985 to replace a blanket 12-month moratorium with tiered review and standards; both passed first reading via consent. Did not object to the moratorium's second-reading consent passage.",
        position: 'Public position: opposed blanket moratorium; sponsored alternative',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/money/business/development/2026/09/01/memphis-city-council-continues-weighing-options-on-data-center-limits-sept-1/91546651007/',
      },
    ],
    leadership_role: 'Chair of the Planning & Zoning Committee',
    mayor_alignment: {
      example:
        "No public record of direct conflict with or endorsement of Mayor Paul Young's administration was found. His posture is collaborative rather than oppositional: his March 2026 short-term-rental resolution explicitly asked the Mayor's administration to identify enforcement partners and report back within 90 days rather than dictating terms. His data-center stance — resisting the blanket moratorium pushed by progressives while proposing a regulated framework — generally dovetails with Young's pro-growth administration, though that alignment is inferred, not evidenced.",
      relationship: 'independent',
      source_name: 'WMC Action News 5 (via wvlt.tv)',
      source_url:
        'https://www.wvlt.tv/2026/03/04/neighbors-demand-action-memphis-city-council-after-repeated-violence-short-term-rentals/',
    },
    name: 'Philip Spinosa',
    notable_quotes: [
      {
        id: 'philip-spinosa-quote-1',
        context: 'Planning & Zoning committee, Sept 2026, on data-center guardrails',
        quote:
          'Memphis has an opportunity to change the game... We have not exercised our leverage to benefit the entire community.',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/money/business/development/2026/09/01/memphis-city-council-continues-weighing-options-on-data-center-limits-sept-1/91546651007/',
      },
      {
        id: 'philip-spinosa-quote-2',
        context:
          'Short-term-rental committee hearing, April 2025, on neighborhood safety incidents tied to STRs',
        quote:
          'I met with a woman three weeks ago by the Liberty Bowl who had bullet holes in her living room.',
        source_name: 'Citizen Portal',
        source_url:
          'https://citizenportal.ai/articles/6265729/Memphis-City/Shelby-County/Tennessee/Council-says-shortterm-rentals-are-a-growing-neighborhood-problem-sponsor-to-bring-ordinance-after-legal-review',
      },
    ],
    opposition_triggers: [
      "Fee and tax increases passed on to residents — the lone 'No' on the 2024 solid waste fee hike.",
      "Reworking union compensation deals mid-stream — voted against overriding the firefighter union's planned raise schedule in the FY2026 budget amendment.",
      'Blanket restrictions on economic development — authored an alternative to the 12-month data-center moratorium rather than supporting a pause with no standards.',
      'Nuisance properties hurting neighborhoods — sponsored STR enforcement crackdown and pushed tighter STR regulations as P&Z chair.',
      'Unfunded or unbalanced spending without a fiscal rationale — consistent fiscal-discipline posture across budget votes.',
    ],
    persuasion_levers: [
      "Community-benefit framing for big deals — 'exercise our leverage to benefit the entire community' language moved him to sponsor the data-center framework.",
      'Neighborhood-level impact stories — personal anecdotes (Liberty Bowl resident) drive his public-safety and enforcement stances.',
      "Standards and best-practice processes — prefers 'pathway' resolutions and research-based frameworks over moratoriums or rushed votes.",
      'Public-safety resources — supports surveillance, enforcement tools, and federal law-enforcement assistance when framed as helping Memphians.',
      'Business-community alignment — Chamber background makes economic-competitiveness and private-sector-collaboration arguments (TVA, MLGW, city-county coordination) effective.',
    ],
    political_style: {
      archetype: 'Business-friendly pragmatist',
      description:
        "Spinosa is a Chamber-adjacent, pro-growth council member who frames issues in deal-making terms ('leverage,' 'change the game') rather than ideological ones, but reliably sides with neighborhood-level concerns on nuisance and public-safety issues, sponsoring short-term-rental enforcement and the earlier surveillance-camera program. He has shown willingness to buck consensus, casting lone or near-lone 'No' votes on tax/fee hikes and pay-restructuring amendments.",
    },
    took_office: 2024,
    twin_voice: {
      example_context: 'Committee on the National Guard resolution, Sept 2025',
      example_quote:
        "If I miss it, I do just want to say that I've spoken with countless neighbors, Memphians, friends... the vast majority of Memphians, in my eyes, are excited to have resources here.",
      source_name: 'Commercial Appeal',
      source_url:
        'https://www.beaconjournal.com/story/news/local/2025/09/23/memphis-city-council-national-guard-resolution/86310215007/',
      style:
        "He speaks in a Chamber-pitch-meets-neighborhood mode: plainspoken, anecdotal, and deal-framed, frequently citing 'countless neighbors' and 'folks' he's talked to, then pivoting to leverage and framework language.",
    },
    voting_bloc:
      "Thin record; no stable bloc evidenced. The clearest co-votes observed: with Jerri Green (joint 'No' on the FY2026 3% raise amendment, June 2025), and procedural alignment with Jeff Warren (both introduced paired alternative data-center resolutions during the Sept 1, 2026 P&Z committee). Otherwise unknown.",
  },
  {
    id: 'edmund-ford-sr',
    bio: 'Licensed embalmer and funeral director since 1979 who founded E.H. Ford Mortuary in 1995; B.S. in Government and Public Affairs from Tennessee State University and a mortuary science degree from John Gupton College in Nashville. A member of the prominent Ford political family (son Edmund Ford Jr. formerly held the same District 6 seat and now sits on the Shelby County Commission), he served on the council 1999–2007 and was re-elected in October 2019, taking office January 1, 2020.',
    committees: {
      'MATA (Memphis Area Transit Authority)': 'Liaison (council representative)',
      'Minority Business Development Oversight Commission (MBDOC)':
        'Liaison (council representative)',
      'Planning & Zoning Committee': 'Vice Chair',
      'Transportation Committee': 'Chair',
    },
    data_gaps: [
      'No verbatim direct quotes from Ford Sr. found in any 2024–2026 source; coverage paraphrases him. Daily Memphian, WMC, and ABC24 articles did not surface in searches.',
      'Committee roles: official memphistn.gov District 6 page lists Chair of Transportation, Vice-Chair of Planning and Zoning, liaison for MATA and MBDOC. ballotproject.org (crawled ~Aug 2026) lists conflicting roles — Chair of Economic Development, Tourism & Technology; Vice-Chair of Transportation; liaison for EDGE and MBDOC — possibly reflecting older 2024–2025 assignments. Current 2026 roster could not be independently reconciled.',
      'Term end date: sources conflict (ballotproject: 12/31/2028; Wikipedia/task brief: 2024–2027, next election Oct 2027).',
      'Full roll-call voting record for 2024–2026: unverified; positions above are drawn from media coverage of contested items only.',
      'Positions on public safety, MLGW/TVA utilities, housing, and education/youth could not be evidenced with 2024–2026 sources — omitted.',
      "No public statement located from Ford Sr. regarding his son Edmund Ford Jr.'s February 2025 federal indictment (bribery/tax evasion) — omitted per no-verification rule.",
      'Voting bloc: only issue-specific alignment observed; no consistent bloc partner documented.',
    ],
    district: 'District 6',
    issue_positions: {
      budget_taxes: {
        evidence:
          "June 23, 2026 budget committee: Ford and Chase Carlisle 'shot down' Jeff Warren's proposal to raise taxes to fund the Group Violence Intervention Program; the full council then passed a ~$900M budget with no tax increase.",
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/news/politics/2026/06/23/memphis-city-council-passes-budget-pay-raises/90650153007/',
        stance:
          'Consistent no-tax-hike fiscal conservative. Ford treats tax increases as a last resort and publicly killed a 2026 property-tax proposal in budget committee, backing budgets that hold the line on rates even when colleagues argue the city has underfunded itself.',
      },
      economic_development_pilots: {
        evidence:
          "Feb. 4, 2025: Ford pushed to delay the xAI $80M wastewater land deal vote, arguing council and the community had been 'backdoored.' Aug. 2025 council meeting: Ford said Memphis was losing ground to neighboring states and urged recognition of local organizations' investments.",
        source_name: 'Commercial Appeal/Beacon Journal',
        source_url:
          'https://www.beaconjournal.com/story/money/business/development/2025/02/04/memphis-city-council-delays-vote-xai-wastewater-facility-deal/78215781007/',
        stance:
          'Pro-competitiveness but demands transparency and community buy-in before big deals move. Ford argues Memphis is losing ground to Arkansas and Mississippi and wants the city to attract and retain opportunities — but he will slow down administration-backed deals he sees as back-room arrangements.',
      },
      neighborhoods_services: {
        evidence:
          "At the August 19, 2025 council meeting Ford criticized the perception the city wasn't doing enough to maintain cleanliness and said improvements in local schools and neighborhoods were being made by private entities rather than the city government.",
        source_name: 'Citizen Portal',
        source_url:
          'https://citizenportal.ai/articles/5731726/Memphis-City/Shelby-County/Tennessee/Councilman-Ford-Highlights-Missed-Opportunities-for-Memphis-Amid-Sanitation-Concerns',
        stance:
          'District-service hawk who criticizes the city when sanitation and basic services in neighborhoods look neglected. He points out that private entities, schools, and local organizations — not City Hall — are making many visible improvements in his district.',
      },
      transit_infrastructure: {
        evidence:
          "Sept. 1, 2026 council meeting approved the nine MATA appointees recommended by Mayor Young; Ford holds the council's MATA liaison role and Transportation chairmanship.",
        source_name: 'Commercial Appeal; memphistn.gov District 6 page',
        source_url:
          'https://www.commercialappeal.com/story/news/politics/2026/09/02/mlgw-storm-cleanup-cost-estimate/91515532007/',
        stance:
          "Institutionally invested in transit oversight as Transportation Committee chair and council liaison to MATA. He backed the mayor's 2026 slate of nine new MATA board appointees amid the authority's turmoil (trusteeship, no permanent CEO, Mauldin lawsuit), signaling support for rebuilding the board's structure rather than fighting the mayor on transit governance.",
      },
    },
    key_votes: [
      {
        id: 'edmund-ford-sr-vote-1',
        date: '2025-02-04',
        item: "Land-purchase agreement for xAI's 13-acre 'Colossus Water Recycling Plant' south of the T.E. Maxson wastewater plant ($80M facility, $820K land offer) — pushed for a two-week delay so council could meet xAI reps, 'echoing' Cooper-Sutton's criticism that the deal was negotiated without community engagement.",
        position: 'Yes (vote to delay)',
        source_name: 'Commercial Appeal/Beacon Journal',
        source_url:
          'https://www.beaconjournal.com/story/money/business/development/2025/02/04/memphis-city-council-delays-vote-xai-wastewater-facility-deal/78215781007/',
      },
      {
        id: 'edmund-ford-sr-vote-2',
        date: '2026-06-23',
        item: "FY2026–27 ~$900M city budget — joined Chase Carlisle in 'shooting down' Jeff Warren's proposal for a property tax increase to fund the Group Violence Intervention Program during budget committee; the council passed the budget with no tax increase.",
        position: 'No (to any tax increase)',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/news/politics/2026/06/23/memphis-city-council-passes-budget-pay-raises/90650153007/',
      },
      {
        id: 'edmund-ford-sr-vote-3',
        date: '2026-09-01',
        item: 'Resolution renaming Union Avenue (Dunlap to Manassas) to honor former Mayor Lee Harris, sponsored by Councilwoman Jerri Green — resolution passed despite pushback from Ford Sr. and Councilman Jeff Warren.',
        position: 'Opposed / pushback',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/news/politics/2026/09/02/mlgw-storm-cleanup-cost-estimate/91515532007/',
      },
      {
        id: 'edmund-ford-sr-vote-4',
        date: '2025 (budget season)',
        item: "Councilwoman Jerri Green's $66.44M operating-budget amendment package — Ford moved (Walker seconded) to accept the amendment for full-committee debate; carried. The amendment was not adopted; vote was deferred for review.",
        position: 'Procedural support',
        source_name: 'Citizen Portal',
        source_url:
          'https://citizenportal.ai/articles/6231500/Memphis-City/Shelby-County/Tennessee/Council-committee-accepts-Councilwoman-Greens-6644-million-operating-budget-amendment-for-further-review',
      },
      {
        id: 'edmund-ford-sr-vote-5',
        date: '2026-09-01',
        item: "Appointments of nine new MATA board members recommended by Mayor Paul Young — council approved the slate; Ford is the council's MATA liaison.",
        position: 'Yes',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/news/politics/2026/09/02/mlgw-storm-cleanup-cost-estimate/91515532007/',
      },
    ],
    leadership_role: 'none',
    mayor_alignment: {
      example:
        "Ford cooperates with Mayor Paul Young's administration on constituent-facing work — he appeared alongside administration officials at the mayor's 'One Memphis' town hall in Whitehaven in 2024 — but does not hesitate to publicly break with the administration on process grounds. On Feb. 4, 2025, when the mayor's Public Works division backed the $80M xAI wastewater land deal, Ford joined Councilwomen Cooper-Sutton and Walker in speaking out against the lack of transparency and pushed for a two-week delay so the council could meet directly with xAI representatives.",
      relationship: 'independent',
      source_name: 'Commercial Appeal/Beacon Journal; City of Memphis govdelivery',
      source_url:
        'https://www.beaconjournal.com/story/money/business/development/2025/02/04/memphis-city-council-delays-vote-xai-wastewater-facility-deal/78215781007/',
    },
    name: 'Edmund Ford, Sr.',
    notable_quotes: [
      {
        id: 'edmund-ford-sr-quote-1',
        context:
          "Reporter paraphrase of Ford Sr.'s remarks at the Feb. 4, 2025 council meeting on the xAI wastewater land deal. NOTE: no verbatim direct quotes from Ford Sr. were located in any 2024–2026 source; reporters consistently paraphrase him.",
        quote:
          'Ford echoed the sentiment and pushed for a delay in voting until Council has more time to discuss the project with xAI representatives.',
        source_name: 'Commercial Appeal/Beacon Journal',
        source_url:
          'https://www.beaconjournal.com/story/money/business/development/2025/02/04/memphis-city-council-delays-vote-xai-wastewater-facility-deal/78215781007/',
        verbatim: false,
      },
      {
        id: 'edmund-ford-sr-quote-2',
        context:
          "Reporter paraphrase of Ford Sr.'s floor remarks at the Aug. 19, 2025 council meeting on sanitation, services, and missed opportunities. NOTE: not a verbatim quote.",
        quote:
          'Ford urged the council to recognize the contributions of local organizations and schools ... calling for greater transparency and recognition of these efforts.',
        source_name: 'Citizen Portal',
        source_url:
          'https://citizenportal.ai/articles/5731726/Memphis-City/Shelby-County/Tennessee/Councilman-Ford-Highlights-Missed-Opportunities-for-Memphis-Amid-Sanitation-Concerns',
        verbatim: false,
      },
    ],
    opposition_triggers: [
      'Any property tax increase proposal — he publicly killed the 2026 GVIP-related tax-hike idea in committee (Commercial Appeal, 6/23/2026).',
      "Deals negotiated 'backdoor' without community engagement or council briefing — the xAI wastewater land deal triggered him to echo Cooper-Sutton and demand a delay (Beacon Journal, 2/4/2025).",
      'Honoring political rivals: he pushed back on renaming Union Avenue for former Mayor Lee Harris (Commercial Appeal, 9/2/2026). Harris endorsed Davin Clemons, who ran against Ford Sr. in the 2019 District 6 race (Memphis Flyer, 2019 election guide).',
      'Perceived neglect of basic neighborhood services — sanitation/cleanliness criticism where he noted private entities, not the city, were making improvements (Aug. 2025 meeting summary).',
      'Failure to acknowledge/recognize contributions of local organizations and schools — he took the floor to demand recognition of their investments (Aug. 2025 meeting summary).',
    ],
    persuasion_levers: [
      'Frame benefits at the District 6 neighborhood level (Whitehaven, South Memphis, Downtown, Riverfront) — district service is his stated priority.',
      'Keep it tax-neutral or tax-cutting; he votes with fiscal conservatives and against new levies.',
      'Do the community engagement work first: brief him and neighborhood stakeholders before items reach committee; he rewards transparency and punishes surprises.',
      'Tie proposals to minority business development — he is the council liaison for the Minority Business Development Oversight Commission (MBDOC).',
      'Invoke regional competitiveness — he responds to arguments that Memphis must compete with Arkansas and Mississippi for investment and resources.',
    ],
    political_style: {
      archetype: 'Fiscal-watchdog, district-first pragmatist',
      description:
        "He treats City Hall process as a public trust: Ford reliably opposes tax increases and resists items he believes were negotiated out of public view, but he is procedural rather than theatrical — moving to delay for more information instead of staging a floor fight. His politics run through District 6's geography (Whitehaven, South Memphis, Downtown, Riverfront) rather than through a citywide ideological program.",
    },
    took_office: 2020,
    twin_voice: {
      example_context:
        'Reported (not verbatim); no direct Ford Sr. quotes were found in 2024–2026 coverage.',
      example_quote:
        "At the Aug. 19, 2025 meeting he 'took the floor to emphasize the importance of seizing opportunities for the city,' said Memphis was 'losing ground' to Arkansas and Mississippi, and criticized the perception the city wasn't maintaining cleanliness while private entities made the real neighborhood improvements.",
      source_name: 'Citizen Portal',
      source_url:
        'https://citizenportal.ai/articles/5731726/Memphis-City/Shelby-County/Tennessee/Councilman-Ford-Highlights-Missed-Opportunities-for-Memphis-Amid-Sanitation-Concerns',
      style:
        "Ford speaks in meetings as a measured, senior institutional voice — he rises on process, recognition, and district service rather than ideology, and uses 'transparency' and 'missed opportunities' as his recurring frames. His characteristic move is not a dramatic 'no' but a procedural slowdown: demand more time, more briefings, and more community input.",
    },
    voting_bloc:
      'Thin evidence; no consistent bloc documented. Issue-specific alignment observed: with Yolanda Cooper-Sutton and Pearl Eva Walker on transparency/deal-scrutiny (xAI delay, Feb. 2025); with Chase Carlisle on fiscal restraint/no tax increases (2026 budget). Full roll-call voting pattern: unverified.',
  },
  {
    id: 'michalyn-easter-thomas',
    bio: 'Dr. Michalyn Easter-Thomas is a Memphis native, public-school educator (instructional facilitator with Memphis Shelby County Schools, Doctorate of Education from Vanderbilt University), and founder of the North Memphis nonprofit Our Grass Our Roots, which fights gentrification and promotes neighborhood land ownership. She was elected to represent District 7 (Mud Island, Uptown, Frayser, North Memphis) in 2019 and took office in 2020 as the youngest African American ever elected to the Memphis City Council; she won a Nov. 16, 2023 runoff to begin her second term (2024-2027).',
    committees: {
      'Economic Development, Tourism & Technology Committee': 'Vice Chair',
      'Public Services, Arts, & Youth Initiatives Committee': 'Chair',
    },
    data_gaps: [
      'Outcome of the April 2024 Board of Ethics complaint over her Memphis River Parks Partnership employment — unverified; she did not resign and continues to serve.',
      "Her exact individual roll-call vote on the FY25 49-cent property tax increase (June 25, 2024) — only Spinosa's sole 'no' on the solid waste fee hike is sourced; her tax-hike vote is inferred from the passage but not individually verified.",
      'Individual roll-call position on the FY27 budget passed June 23, 2026 — not verified per-member.',
      'Final disposition of her correctional-facilities ordinance (No. 5958), held until Dec 16, 2025 — outcome unverified; the item drew a community petition alleging it was a backdoor for a new jail in New Chicago.',
      'MLGW/utilities and transit/infrastructure: no verified 2024-2026 positions — she does not sit on the MLGW committee. Omitted.',
      'Council-wide leadership 2026: no officer role found; unverified if any exists.',
    ],
    district: 'District 7',
    issue_positions: {
      budget_taxes: {
        evidence:
          'Co-proposed a one-month citation abatement program (with Green, Smiley, Swearengen-Washington, Warren) to raise funds to avoid the property tax increase, noting over $265 million in outstanding citations since 1991 (Commercial Appeal, 2024-05-27).',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.beaconjournal.com/story/news/politics/2024/05/27/memphis-city-council-unions-budget/73632267007/',
        stance:
          'Fiscally cautious progressive: she resists broad property-tax hikes as a first resort, preferring revenue alternatives, but ultimately votes for balanced budgets that protect services and worker pay. She pushed the citation-abatement alternative before the FY25 49-cent hike and sponsored the 3%-raise-for-all-workers shift in the FY26 budget process.',
      },
      economic_development_pilots: {
        evidence:
          'Named with JB Smiley Jr., Jana Swearengen-Washington, and Jerri Green as a sponsor in the pre-final ordinance draft published Aug. 31, 2026.',
        source_name:
          'Published pre-final ordinance draft shared by @jbsmileyjr on Instagram, Aug. 31, 2026',
        source_url: '',
        stance:
          'Strong support signal for the temporary moratorium, consistent with her record of seeking community oversight and environmental protections around data-center development. Sponsorship is not certainty under Rule 23.',
      },
      education_youth: {
        evidence:
          "Introduced a June 2025 resolution to allocate excess property-tax funds from xAI to prekindergarten programs (first proposed amendment to the FY26 budget) and sponsored a resolution to amend the FY26 operating budget allocating $1,500,000 to the 'Pre-K for All' program (committee agenda, June 24, 2025).",
        source_name: 'HereMemphis; memphistn.gov committee agenda',
        source_url:
          'https://memphistn.gov/wp-content/uploads/2025/06/Committee-Agenda-June-24-2025-v1-62025-1030-am-1.pdf',
        stance:
          'Pre-K and youth-services evangelist: as council liaison to Shelby County Schools and chair of the youth-initiatives committee, she treats early childhood and youth programming as the highest-budget priority, and tries to convert corporate tax windfalls into education funding.',
      },
      housing: {
        evidence:
          'Co-sponsored (with Canale, Logan, Green, Swearengen-Washington, Spinosa, Ford Sr., Smiley, Cooper-Sutton, Carlisle, Warren) the Joint City/County Ordinance establishing the Memphis Shelby County Building Home Program under the Tennessee Homestead Act, brought to the Planning & Zoning Committee.',
        source_name: 'memphistn.gov committee agenda',
        source_url:
          'https://memphistn.gov/wp-content/uploads/2025/05/Committee-Agenda-May-6-2025-v4-5625-730-am.pdf',
        stance:
          'Anti-gentrification housing advocate: her district work prioritizes neighborhood land ownership and affordable home programs rooted in her Our Grass Our Roots organizing.',
      },
      neighborhoods_services: {
        evidence:
          "Introduced the June 9, 2025 budget-committee resolution naming the FY26 CIP line for the Douglas Community Center ('Douglas Community Center is well deserving and needing of a replacement'); earlier secured $100,000 for Greenlaw Community Center programming.",
        source_name: 'Citizen Portal; Commercial Appeal',
        source_url:
          'https://citizenportal.ai/articles/6207023/Memphis-City/Shelby-County/Tennessee/Council-committee-names-FY26-CIP-line-for-Douglas-Community-Center',
        stance:
          'Hyper-local service delivery champion: she relentlessly pursues capital and programming dollars for community centers and parks in District 7 and North Memphis, using budget and CIP processes to direct bricks-and-mortar investment to disinvested neighborhoods.',
      },
      public_safety: {
        evidence:
          'Led the charge in the FY24 budget for $100,000 for programming at Greenlaw Community Center with activities led by the Memphis Police Department, and in 2023 proposed $250,000 for community-led youth activities at Greenlaw after MPD rescinded curfew-enforcement plans.',
        source_name: 'Commercial Appeal; WMC Action News 5',
        source_url:
          'https://www.beaconjournal.com/story/news/local/2023/06/27/memphis-property-tax-stays-flat-public-safety-employees-to-see-base-salary-increase/70348347007/',
        stance:
          "Prevention-leaning: her public-safety record centers on funding youth programming, community centers, and MPD-partnered community activities over enforcement expansion. In 2020 she pledged to 'be intentional with city policy, regulating excessive force by the police department' — an older quote that reflects her baseline philosophy, though her 2024-2026 record is legislative rather than rhetorical.",
      },
    },
    key_votes: [
      {
        id: 'michalyn-easter-thomas-vote-1',
        date: '2024-06-25',
        item: 'FY25 budget: 49-cent property tax increase and three-year solid waste fee hike. Only Councilman Phillip Spinosa voted against the solid waste fee hike; Easter-Thomas had first co-proposed the citation-abatement alternative to avoid the tax hike, then voted for the final amended package.',
        position: 'Yes',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.beaconjournal.com/story/news/government/city/2024/06/25/memphis-2025-budget-tax-increases/74169400007/',
      },
      {
        id: 'michalyn-easter-thomas-vote-2',
        date: '2024-12-03',
        item: "'More for Memphis' fiscal agent (privately endowed, multi-billion-dollar community development initiative); contested passage 6-3-1 recorded.",
        position: 'Yes',
        source_name: 'Shelby County Observer',
        source_url:
          'https://shelbycountyobserver.com/j-ford-canale-memphis-city-council-vote-manipulation-memphis-councils-mysterious-vote-shift-on-1b-more-for-memphis-scheme/',
      },
      {
        id: 'michalyn-easter-thomas-vote-3',
        date: '2025-04-08',
        item: 'Substitute Ordinance No. 5937 — raise hotel-motel occupancy tax to 4%, restricted to tourism/tourism development.',
        position: 'Yes',
        source_name: 'Citizen Portal',
        source_url:
          'https://citizenportal.ai/articles/6081112/Memphis-City/Shelby-County/Tennessee/Council-approves-substitute-ordinance-to-raise-hotelmotel-tax-to-4-for-tourism-development',
      },
      {
        id: 'michalyn-easter-thomas-vote-4',
        date: '2025-06-10',
        item: "FY26 budget process: introduced companion resolution to allocate $1,500,000 of FY26 operating budget to the 'Pre-K for All' program (June 24, 2025 committee); had backed the 3% raise for all city employees over the mayor's plan.",
        position: 'Sponsor (public position)',
        source_name: 'memphistn.gov committee agenda; Commercial Appeal',
        source_url:
          'https://www.beaconjournal.com/story/news/local/2025/06/10/memphis-city-2026-budget/84140143007/',
      },
      {
        id: 'michalyn-easter-thomas-vote-5',
        date: '2025-08-19',
        item: 'Substitute Ordinance No. 5953 — xAI property-tax revenue reserve fund (25% of xAI taxes for Boxtown/Whitehaven area, capped at $100M, 1% environmental education minimum); full council roll call recorded Easter-Thomas — yes; she also proposed a future community-advisory-board resolution.',
        position: 'Yes',
        source_name: 'Citizen Portal; Commercial Appeal',
        source_url:
          'https://citizenportal.ai/articles/6585216/Memphis-City/Shelby-County/Tennessee/Memphis-Council-approves-ordinance-enabling-AI-property-tax-funds-for-community-benefits-adds-1-education-requirement',
      },
      {
        id: 'michalyn-easter-thomas-vote-6',
        date: '2026-08-31',
        item: 'Ordinance 5982 working reference — 12-month data-center moratorium; published pre-final draft number field was blank',
        position:
          'Strong support signal (co-sponsor named in the published draft; sponsorship is not certainty under Rule 23)',
        source_name:
          'Published pre-final ordinance draft shared by @jbsmileyjr on Instagram, Aug. 31, 2026',
        source_url: '',
      },
    ],
    leadership_role: 'none',
    mayor_alignment: {
      example:
        "In May 2024 she co-proposed a one-month citation-abatement program explicitly framed as a way to 'avoid a property tax increase' — a direct alternative to Mayor Paul Young's proposed 75-cent property tax hike — alongside Chairman JB Smiley, Jerri Green, Jana Swearengen-Washington, and Jeff Warren. She is not reflexively anti-administration: she voted Yes on Young's aligned 'More for Memphis' fiscal-agent item (Dec 3, 2024) and on his xAI community-benefits ordinance, but pushed beyond his proposal by demanding a community advisory board for the xAI funds.",
      relationship: 'independent',
      source_name: 'Commercial Appeal',
      source_url:
        'https://www.beaconjournal.com/story/news/politics/2024/05/27/memphis-city-council-unions-budget/73632267007/',
    },
    name: 'Michalyn Easter-Thomas',
    notable_quotes: [
      {
        id: 'michalyn-easter-thomas-quote-1',
        context:
          "During debate on the xAI tax-revenue reserve fund, proposing a community advisory board resolution; Cooper-Sutton's push to raise the allocation from 25% to 75% had just failed for lack of a second. August 19, 2025.",
        quote:
          "It is a good effort to have a community advisory board to give that input because we haven't really done anything like this before.",
        source_name: 'Commercial Appeal / Daily Memphian',
        source_url:
          'https://www.beaconjournal.com/story/money/business/2025/08/19/elon-musk-xai-in-memphis-tax-reserve-fund/85732791007/',
      },
      {
        id: 'michalyn-easter-thomas-quote-2',
        context:
          "Introducing a budget-committee resolution to name a FY26 CIP line item for the Douglas Community Center, requesting colleagues' support. June 9, 2025.",
        quote: 'Douglas Community Center is well deserving and needing of a replacement.',
        source_name: 'Citizen Portal',
        source_url:
          'https://citizenportal.ai/articles/6207023/Memphis-City/Shelby-County/Tennessee/Council-committee-names-FY26-CIP-line-for-Douglas-Community-Center',
      },
    ],
    opposition_triggers: [
      'Development deals that bypass community input — she co-sponsored the 12-month data center moratorium (Ordinance 5982, Sept 2026) and pushed a community advisory board over xAI funds.',
      'Jails, prisons, or detention facilities sited without council review — she sponsored Ordinance 5958 (late 2025) requiring special-use-permit review for correctional facilities in industrial zoning districts.',
      "Property-tax hikes as a first resort — she co-proposed the citation-abatement program as an alternative to Mayor Young's 75-cent hike in May 2024.",
      'Institutional non-responsiveness to the council — she publicly rebuked the Greater Memphis Chamber for skipping the April 28, 2026 Economic Development committee hearing.',
      'Conflict-of-interest scrutiny around her own dual roles — she routinely recused/abstained from items tied to the Memphis River Parks Partnership, her former grant-funded employer, during the April 2024 Board of Ethics complaint.',
    ],
    persuasion_levers: [
      "Youth and education investment — she sponsored the $1.5M Pre-K for All FY26 budget amendment and pushed xAI tax funds toward pre-K; 'investing in youth' is her reliable Yes trigger.",
      'Community centers and neighborhood amenities — Greenlaw Community Center ($100K FY24, $250K request) and Douglas Community Center CIP naming show she is moved by tangible neighborhood infrastructure.',
      'Community-control mechanisms — pairing proposals with advisory boards, public input, or resident oversight (xAI advisory board, community meeting engagement on Greenlaw) makes her far likelier to support a deal.',
      "Environmental justice framing in South/West Memphis — the xAI reserve fund's 1%-environmental-education amendment and the data center moratorium show she votes to protect Boxtown/Whitehaven communities from industrial burdens.",
      "Economic mobility / Black wealth framing — she voted Yes on the 'More for Memphis' fiscal-agent item, the privately endowed plan explicitly aimed at increasing African American wealth and economic mobility.",
    ],
    political_style: {
      archetype: 'Equity-centered community advocate',
      description:
        'Easter-Thomas legislates like an organizer: she frames nearly every issue through neighborhood impact on North and South Memphis residents, pairs skepticism of developer-led projects with demands for community-input structures, and consistently channels corporate tax revenue toward youth, education, and disinvested neighborhoods rather than debt service or citywide general funds.',
    },
    took_office: 2020,
    twin_voice: {
      example_context: 'During the xAI tax reserve fund debate, August 19, 2025.',
      example_quote:
        "It is a good effort to have a community advisory board to give that input because we haven't really done anything like this before.",
      source_name: 'Commercial Appeal / Daily Memphian',
      source_url:
        'https://www.beaconjournal.com/story/money/business/2025/08/19/elon-musk-xai-in-memphis-tax-reserve-fund/85732791007/',
      style:
        "Direct, community-rooted, and disarmingly plain-spoken. In meetings she speaks as a North Memphis organizer and educator rather than a technocrat — favoring moral-clarity framing ('what do our residents get out of this?') and pressing for resident input structures. She is comfortable with awkward conversations ('Things sometimes get uncomfortable... It's not always you go into a community meeting everybody agrees and then you go home smiling and happy,' WMC Action News 5, 2023) and cites first principles about precedent and fairness.",
    },
    voting_bloc:
      'Consistent progressive-bloc voter: most often votes alongside JB Smiley Jr., Jeff Warren, Jerri Green, Jana Swearengen-Washington, and Yolanda Cooper-Sutton. Evidence: Yes votes together on the contested More for Memphis fiscal-agent item (Dec 3, 2024); co-sponsors of the data center moratorium (Smiley, Green, Swearengen-Washington, Sept 2026); co-proposers of the citation-abatement alternative (Smiley, Green, Swearengen-Washington, Warren, May 2024); co-sponsors of the paid parental leave resolution (Green, Warren, Cooper-Sutton, May 2026).',
  },
  {
    id: 'jb-smiley-jr',
    bio: "Attorney and founder of Smiley & Associates, PLLC (2017); passed the Arkansas and Tennessee bar exams; author of 'Born With It: Unleashing Your Greatness'; Memphis Flyer Top 20 Under 30 (2018); former policy advisor to the Shelby County Clerk. Ran for Tennessee governor in the 2022 Democratic primary (finished just short of the nomination) and for Shelby County mayor in 2026 (finished 2nd in the Democratic primary with 23.8% to Mickell Lowery's 32%). Council chairman in 2024; term-limited on the council, serving through the end of the 2024-2027 term.",
    committees: {
      'Memphis & Shelby County Film and Television Commission': 'Council Liaison',
      'Planning & Zoning Committee': 'Vice Chair (2026)',
      'Public Works, Solid Waste & General Services Committee': 'Chair (2026)',
      'Urban Art Commission': 'Council Liaison',
    },
    data_gaps: [
      'His individual roll-call votes on the FY25-FY27 budgets are unverified beyond the sanitation-worker amendment.',
      'His current posture toward the Young administration in 2026 (after losing the county-mayor primary) is thinly documented.',
      'Whether he plans any further office after his term-limited council tenure ends is unverified.',
    ],
    district: 'Super District 8, Position 1',
    issue_positions: {
      budget_taxes: {
        evidence:
          "'My platform is built around growing the tax base without raising tax rates, especially through small business growth, workforce development, housing investment' (2026 candidate questionnaire); FY27 amendment for 5% sanitation-worker raise.",
        source_name: 'Memphis Flyer (candidate questionnaire); Commercial Appeal',
        source_url: 'https://www.memphisflyer.com/questions-for-the-candidates/',
        stance:
          "Grow the tax base, don't raise rates: his 2026 county-mayoral platform centered small-business growth, workforce development, and housing investment before any tax increase; on the council he pushed raises for the lowest-paid city workers.",
      },
      economic_development_pilots: {
        evidence:
          'On Sept. 14, 2026, the night before the expected vote, Smiley posted publicly: “I hear Elon Musk and his lobbyists are in town trying to stop the data center moratorium. They’ve got money. I’ve got Memphis. And we’re NOT for sale.” The statement, combined with his lead sponsorship of the Aug. 31 published draft, is a strongly committed support signal; Rule 23 still permits a sponsor to vote no, but reversal after this public commitment would carry substantial political cost.',
        source_name:
          'Verified Instagram account @jbsmileyjr — public post captured Sept. 14, 2026, approximately 7:38 p.m. CT',
        source_url: '',
        stance:
          'Strongly committed support for the temporary moratorium. He frames the pause as Memphis using its leverage to protect residents while permanent data-center standards are developed.',
      },
      neighborhoods_services: {
        evidence:
          "'It's not my job to tell the people what they want. It's my job to propose ideas, have robust conversations and let the people decide' (on stadium oversight).",
        source_name: 'Commercial Appeal (beaconjournal.com)',
        source_url:
          'https://www.beaconjournal.com/story/sports/college/memphis-tigers/2023/12/04/simmons-bank-liberty-stadium-jb-smiley-memphis-football-asf/71803448007/',
        stance:
          "Champions city workers and neighborhood-level services; his FY27 fight was for sanitation workers' pay, and he frames transparency as letting 'the people decide.'",
      },
      public_safety: {
        evidence:
          "Led deferral of Chief Davis's reappointment and told Public Works Director Knecht: 'Make sure you respond when we come calling on you.'",
        source_name: 'Memphis Flyer',
        source_url: 'https://www.memphis-cms.altnuxt.com/category/politics/page/14/',
        stance:
          'Oversight-minded on public safety leadership: willing to slow-walk top appointments to extract responsiveness from department heads, while backing frontline workers (sanitation, labor).',
      },
      transit_infrastructure: {
        evidence:
          'As Public Works chair he fields drainage-ditch cleaning, deferred park maintenance, and solid-waste issues; requested a pedestrian lighting and safety presentation (Oct 2025 committee agenda).',
        source_name: 'Memphis City Council committee agenda, memphistn.gov',
        source_url:
          'https://memphistn.gov/wp-content/uploads/2025/10/Committee-Agenda-October-7-2025-v1-745-am.pdf',
        stance:
          'Infrastructure-and-services chair focused on basics: solid waste, drainage, deferred maintenance; requested pedestrian lighting and safety proposals.',
      },
    },
    key_votes: [
      {
        id: 'jb-smiley-jr-vote-1',
        date: '2026-09-14',
        item: 'Public commitment supporting the data-center moratorium: “They’ve got money. I’ve got Memphis. And we’re NOT for sale.”',
        position:
          'Strongly committed support (public statement the night before the expected vote; reversal would carry political cost, though Rule 23 still permits a sponsor to vote no)',
        source_name:
          'Verified Instagram account @jbsmileyjr — public post, approximately 7:38 p.m. CT',
        source_url: '',
      },
      {
        id: 'jb-smiley-jr-vote-2',
        date: '2026-06-23',
        item: 'FY27 budget amendment for a 5% raise plus $2,000 bonus for solid-waste employees (council approved the bonus only; his amendment was voted down)',
        position: 'Yes (sponsor; amendment defeated)',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/news/politics/2026/06/23/memphis-city-council-passes-budget-pay-raises/90650153007/',
      },
      {
        id: 'jb-smiley-jr-vote-3',
        date: '2026-08-31',
        item: 'Ordinance 5982 working reference — 12-month data-center moratorium; published pre-final draft number field was blank',
        position:
          'Strong support signal (lead sponsor named in the published draft; sponsorship is not certainty under Rule 23)',
        source_name:
          'Published pre-final ordinance draft shared by @jbsmileyjr on Instagram, Aug. 31, 2026',
        source_url: '',
      },
      {
        id: 'jb-smiley-jr-vote-4',
        date: '2026-03',
        item: 'Substitute ordinance on arbitration of labor impasses (municipal unions)',
        position: 'public position (sponsor)',
        source_name: 'Memphis City Council ordinance document, memphistn.gov',
        source_url:
          'https://memphistn.gov/wp-content/uploads/2026/03/SUBSTITUTE-Impasse-Ordinance-Smiley.pdf',
      },
      {
        id: 'jb-smiley-jr-vote-5',
        date: '2023-12',
        item: 'Resolution seeking city oversight of the Simmons Bank Liberty Stadium renovation (city appointee to the University of Memphis foundation committee; $120M allocation)',
        position: 'public position (sponsor)',
        source_name: 'Commercial Appeal (beaconjournal.com)',
        source_url:
          'https://www.beaconjournal.com/story/sports/college/memphis-tigers/2023/12/04/simmons-bank-liberty-stadium-jb-smiley-memphis-football-asf/71803448007/',
      },
      {
        id: 'jb-smiley-jr-vote-6',
        date: '2025-01-21',
        item: '$250,000 allocation for Riverfront Park improvement and maintenance',
        position: 'Abstain (sole abstention; item passed)',
        source_name: 'Citizen Portal (AI-generated meeting summary)',
        source_url:
          'https://citizenportal.ai/articles/6375138/Memphis-City/Shelby-County/Tennessee/Votes-at-a-glance-key-actions-taken-by-Memphis-City-Council-on-Jan-21-2025',
      },
      {
        id: 'jb-smiley-jr-vote-7',
        date: '2024-01/02',
        item: 'Deferred council action on reappointment of Police Chief CJ Davis and Public Works Director Robert Knecht',
        position: 'public position (led deferrals as chairman)',
        source_name: 'Memphis Flyer',
        source_url: 'https://www.memphis-cms.altnuxt.com/category/politics/page/14/',
      },
    ],
    leadership_role: "none (former Chairman, 2024; now 'Chair Emeritus' per his office)",
    mayor_alignment:
      "Independent — the council's most visible counterweight to Mayor Young early in the term. Evidence: as chairman in 2024 he led the deferral of Police Chief CJ Davis's reappointment and publicly dressed down Public Works Director Robert Knecht over 'attitude,' with the Flyer describing him as positioning 'the council — and himself — as a counterbalance to mayoral authority.'",
    name: 'JB Smiley, Jr.',
    notable_quotes: [
      {
        id: 'jb-smiley-jr-quote-1',
        quote: 'The moratorium gives us time to ask specific questions.',
        source_name: 'Commercial Appeal (data-center committee, Aug 18, 2026)',
        source_url:
          'https://www.commercialappeal.com/story/money/business/development/2026/08/18/memphis-city-council-approves-temp-data-center-moratorium-on-first-reading-on-consent-agenda/91335785007/',
      },
      {
        id: 'jb-smiley-jr-quote-2',
        quote:
          "It's not my job to tell the people what they want. It's my job to propose ideas, have robust conversations and let the people decide.",
        source_name: 'Commercial Appeal (on Liberty Stadium oversight resolution, Dec 2023)',
        source_url:
          'https://www.beaconjournal.com/story/sports/college/memphis-tigers/2023/12/04/simmons-bank-liberty-stadium-jb-smiley-memphis-football-asf/71803448007/',
      },
    ],
    opposition_triggers: [
      "Executive-branch officials who stonewall or show 'attitude' toward the council",
      'Big-ticket projects (stadium, data centers) advanced without city leverage or public deliberation',
      'Budgets that shortchange frontline workers while protecting top salaries',
    ],
    persuasion_levers: [
      'Framing the council as exercising legitimate oversight leverage',
      'Labor and frontline-worker support',
      "Public transparency and 'cards on the table' deliberation",
      'Community-benefit concessions attached to development approvals',
    ],
    political_style:
      "Assertive institutionalist and council-power advocate. Positions the council as a co-equal counterweight to the mayor; comfortable with confrontation ('Make sure you respond when we come calling on you'), but pairs it with detailed policy (labor impasse ordinance, stadium oversight). Ambitious — has run two countywide/statewide races from the council.",
    took_office: '2020 (elected October 2019; re-elected 2023 unopposed)',
    twin_voice:
      "Commanding, deliberate, and lawyerly: speaks in complete arguments, invokes the council's institutional prerogatives, and is willing to dress down officials on the record. Mixes populist transparency rhetoric with procedural mastery. Example: pressing the data-center pause he said, 'The moratorium gives us time to ask specific questions' — calm, authoritative, framing delay as diligence rather than obstruction.",
    voting_bloc:
      'Reform-leaning working alignment with Green (co-sponsored citation abatement 2024, FY27 budget amendments, data-center moratorium) and Swearengen-Washington (moratorium). Voted with Cooper-Sutton, Walker, Warren, White, and Canale to hold the alcohol-code ordinance (April 2025). Patterns are issue-specific, not a fixed bloc.',
  },
  {
    id: 'janika-white',
    bio: 'Attorney and owner of Janika White Law, PLLC, practicing personal injury, business law, and federal criminal defense; former judicial clerk to Chancellor Kenny Armstrong and U.S. District Judge Bernice Bouie Donald; nearly a decade with Bailey, Bailey & White PLLC. Central High School graduate; BA in English (minor in business administration) from UT-Chattanooga; JD from UT College of Law. Won the Super District 8-2 seat in 2023 with 73% of the vote.',
    committees: {
      'Budget & Audit Committee': 'Vice Chair (2025; July 2026 agenda also lists Vice Chair)',
      'Housing & Community Development Committee': 'Vice Chair (July 2026)',
    },
    data_gaps: [
      'Her relationship with the Young administration is unverified.',
      'Her vote/position on the 2026 data-center moratorium is unverified.',
      "The 'Chairwoman Janika White' label on FY27 budget amendments could not be tied to a specific committee chairmanship (July 2026 agenda still lists her as Budget vice chair).",
      'Only one verified direct quote found; her floor-debate record is thinly documented in text sources.',
      'Her positions on public safety, MLGW, transit, and taxes are unverified.',
    ],
    district: 'Super District 8, Position 2',
    issue_positions: {
      budget_taxes: {
        evidence:
          'Vice chair of Budget & Audit; co-sponsored FY27 budget amendment resolutions with Smiley and Green (June 2026).',
        source_name: 'Memphis City Council committee agenda; memphis.granicus.com',
        source_url:
          'https://memphistn.gov/wp-content/uploads/2026/07/Committee-agenda-7.7.26-Revised-07.07.2026-1.pdf',
        stance:
          'Budget-committee technician: co-sponsors detailed budget amendments (operating and CIP) rather than grandstanding on taxes; no public record of her tax-rate philosophy.',
      },
      economic_development_pilots: {
        evidence:
          'At the Nov 4, 2024 Health, Educational and Housing Facility Board meeting she questioned PILOT lessee compliance processes, inspection frequency, and security-plan requirements.',
        source_name:
          'unverified URL — Health, Educational and Housing Facility Board minutes (Nov 4, 2024), found via web search; direct link unavailable',
        source_url: 'unverified',
        stance:
          'Accountability-oriented: pressed PILOT administrators on compliance inspections, security plans, and oversight of tax-abated properties; favors contractual protections (clawbacks) over blocking deals outright.',
      },
      housing: {
        evidence: 'Committee role only.',
        source_name: 'Memphis City Council committee agenda, memphistn.gov',
        source_url:
          'https://memphistn.gov/wp-content/uploads/2026/07/Committee-agenda-7.7.26-Revised-07.07.2026-1.pdf',
        stance:
          'Thin record; serves as vice chair of the Housing & Community Development Committee (2026) but no signature housing positions documented.',
      },
    },
    key_votes: [
      {
        id: 'janika-white-vote-1',
        date: '2025-04-08 (meeting; item reported 2025)',
        item: 'Resolution approving $820,000 sale of Plant Road parcel to support xAI gray-water facility',
        position:
          'Yes (framed narrowly as a property sale with committee-added safeguards including a clawback clause)',
        source_name: 'Citizen Portal (AI-generated meeting summary)',
        source_url:
          'https://citizenportal.ai/articles/6124779/Memphis-City/Shelby-County/Tennessee/Memphis-City-Council-approves-820000-sale-of-Plant-Road-parcel-amid-community-concerns-over-XAI-data-center-and-water-use',
      },
      {
        id: 'janika-white-vote-2',
        date: '2025-10-21 and 2025-12-02',
        item: 'Building/fire code update ordinances (Nos. 5955, 5956, 5962-5964, third readings)',
        position: 'Recused (stated recusal due to her employment)',
        source_name: 'Memphis City Council minutes, memphistn.gov',
        source_url: 'https://memphistn.gov/wp-content/uploads/2025/12/Minutes-12-2-2025-003.pdf',
      },
      {
        id: 'janika-white-vote-3',
        date: '2025-04-08',
        item: 'Motion to hold the alcoholic-beverages code rewrite (Ordinance No. 5934) until April 22, 2025',
        position: 'Yes (voted with Cooper-Sutton, Smiley, Walker, Warren, Canale to hold)',
        source_name: 'Memphis City Council minutes, memphistn.gov',
        source_url: 'http://memphistn.gov/wp-content/uploads/2025/04/Minutes-04-08-25.pdf',
      },
      {
        id: 'janika-white-vote-4',
        date: '2026-06',
        item: 'Resolutions amending the FY27 operating budget and capital improvement program (e.g., advancing Douglass community-center replacement)',
        position:
          "public position (co-sponsor, listed as 'Chairwoman Janika White' with Smiley and Green)",
        source_name: 'Memphis City Council via memphis.granicus.com',
        source_url:
          'https://memphis.granicus.com/MetaViewer.php?view_id=8&clip_id=10763&meta_id=548351',
      },
    ],
    leadership_role:
      "none (committee vice chair; listed as 'Chairwoman' on FY27 budget amendment documents — specific chairmanship unverified, see data_gaps)",
    mayor_alignment:
      'unverified — no public record found of her characterizing her relationship with the Young administration or of direct clashes or alliances. She co-sponsored FY27 budget amendment resolutions with Smiley and Green (June 2026).',
    name: 'Janika White',
    notable_quotes: [
      {
        id: 'janika-white-quote-1',
        quote: "This today is not a vote on a business. It's a vote on a sale of property.",
        source_name: 'Citizen Portal (Plant Road parcel debate, April 2025)',
        source_url:
          'https://citizenportal.ai/articles/6124779/Memphis-City/Shelby-County/Tennessee/Memphis-City-Council-approves-820000-sale-of-Plant-Road-parcel-amid-community-concerns-over-XAI-data-center-and-water-use',
      },
      {
        id: 'janika-white-quote-2',
        quote:
          'unverified — no second direct quote found in 2024-2026 public record; see data_gaps',
        source_name: 'unverified',
        source_url: 'unverified',
      },
    ],
    opposition_triggers: [
      'Legally sloppy or overbroad items (she narrows questions to what is actually being voted on)',
      'Items touching her legal practice (she recuses rather than push through conflicts)',
      'Deals without contractual safeguards or enforcement mechanisms',
    ],
    persuasion_levers: [
      "Clean legal structure and precise framing of what a vote does and doesn't approve",
      'Contractual protections: clawbacks, compliance terms, reversion clauses',
      'Procedural correctness (committee vetting, proper noticing)',
      'Budget-committee-vetted numbers',
    ],
    political_style:
      "Proceduralist and legal-framer. Dissects items into their narrow legal question ('a vote on a sale of property, not a vote on a business'), insists on contractual safeguards like clawbacks, and recuses readily on conflicts — the council's lawyerly technician.",
    took_office: '2024 (elected October 2023 with 73%; sworn in January 2024)',
    twin_voice:
      "Precise, calm, and lawyerly: reframes heated debates into narrow legal questions and insists on safeguards over symbolism. Speaks sparingly but decisively; quick to recuse when conflicted. Example: on the contentious xAI parcel sale she said, 'This today is not a vote on a business. It's a vote on a sale of property' — defusing the room by shrinking the question to its legal dimensions.",
    voting_bloc:
      'unknown — voted with the hold-bloc (Cooper-Sutton, Smiley, Walker, Warren, Canale) on the alcohol ordinance (April 2025) and co-sponsors budget amendments with Smiley and Green; too thin for a bloc label.',
  },
  {
    id: 'yolanda-cooper-sutton',
    bio: 'Community healthcare worker and certified Healthcare Advocate; Tennessee notary public; holds a University of Pennsylvania professional-development certificate in Health Care Innovation and studied at Riley Business College (Dothan, Alabama). Active with Respect The Haven Community Development Corporation, Westwood Neighborhood Association, Union Mission Homeless Shelter, the Tillman Community Center after-school program, Junior League of Memphis, and Friends of the Memphis Public Library; member of Church of God in Christ – Messiah Fellowship. Memphis resident for 27 years; won her seat with just 26% in a crowded 2023 field.',
    committees: {
      'Chickasaw Basin Authority': 'Council Liaison',
      'First 8: Seeding Success': 'Council Liaison',
      'Libraries and Neighborhood Improvement Committee': 'Chair (2026)',
      'Public Services, Arts, and Youth Initiatives Committee':
        'Vice Chair (2026; chaired this committee in 2025)',
    },
    data_gaps: [
      'Her relationship with the Young administration is unverified.',
      'Her positions on the FY25-FY27 budgets, tax rates, MLGW rates, and transit are unverified.',
      'The status of her July 2026 data-center zoning ordinance (passed, pending, or superseded by the moratorium) is unverified.',
      'Citizen Portal summaries used for one item are AI-generated and mangle names; tallies should be cross-checked against official minutes.',
    ],
    district: 'Super District 8, Position 3',
    issue_positions: {
      economic_development_pilots: {
        evidence:
          "'We see the data centers and what is happening across the country, and we need some guardrails' (July 2026); her ordinance imposed $50K-$250K daily fines and a permit sunset.",
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/money/business/development/2026/07/07/memphis-city-council-data-centers-zoning-laws/90826747007/',
        stance:
          "The council's most aggressive data-center regulator: wants enforceable guardrails — steep daily fines, permit sunsets, water/air monitoring — and a joint city-county framework, arguing the industry is being sited in Black communities without consent or benefit.",
      },
      education_youth: {
        evidence: 'Committee roles and liaison assignments only.',
        source_name: 'City of Memphis, Super District 8-3 page (memphistn.gov)',
        source_url: 'https://memphistn.gov/city_council/super-district-8-3/',
        stance:
          'Youth-services oriented (chairs/vises committees covering youth initiatives; liaison to First 8: Seeding Success, an early-childhood collaborative), though specific policy positions are thinly documented.',
      },
      neighborhoods_services: {
        evidence:
          "'They live in that community. They are the ones that have been affected for decades' — urging better outreach before xAI-area projects proceed.",
        source_name: 'Citizen Portal (AI-generated meeting summary)',
        source_url:
          'https://citizenportal.ai/articles/6124779/Memphis-City/Shelby-County/Tennessee/Memphis-City-Council-approves-820000-sale-of-Plant-Road-parcel-amid-community-concerns-over-XAI-data-center-and-water-use',
        stance:
          'Libraries-and-neighborhoods chair focused on resident-facing services and genuine engagement; insists projects answer to the people who live nearest them.',
      },
      public_safety: {
        evidence: 'No verified positions found.',
        source_name: 'unverified',
        source_url: 'unverified',
        stance:
          'Thin record on policing; her public-safety-adjacent work runs through community health and youth programming rather than MPD policy.',
      },
    },
    key_votes: [
      {
        id: 'yolanda-cooper-sutton-vote-1',
        date: '2026-07-07',
        item: 'Introduced data-center zoning ordinance: daily fines of $50,000-$250,000 for water/air violations, sunset of environmental permits granted before Jan 1, 2025 (expiring July 1, 2026, requiring recertification)',
        position: 'public position (sponsor; discussed in Planning & Zoning committee)',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/money/business/development/2026/07/07/memphis-city-council-data-centers-zoning-laws/90826747007/',
      },
      {
        id: 'yolanda-cooper-sutton-vote-2',
        date: '2026-08-18',
        item: '12-month data-center moratorium ordinance (first reading, passed on consent agenda)',
        position:
          'First reading advanced on consent; the Aug. 31 published pre-final draft does not list Cooper-Sutton among its four sponsors',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/news/local/2026/08/14/memphis-data-center-development-possible-pause/91304172007/',
      },
      {
        id: 'yolanda-cooper-sutton-vote-3',
        date: '2026-09-01',
        item: "Publicly criticized Spinosa's and Warren's alternative data-center resolutions as 'grandstanding'",
        position: 'public position',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/money/business/development/2026/09/01/memphis-city-council-continues-weighing-options-on-data-center-limits-sept-1/91546651007/',
      },
      {
        id: 'yolanda-cooper-sutton-vote-4',
        date: '2025-04-08 (meeting; item reported 2025)',
        item: 'Resolution approving $820,000 sale of Plant Road parcel to support xAI gray-water facility',
        position:
          'Yes (while demanding better community engagement and answers to technical questions)',
        source_name: 'Citizen Portal (AI-generated meeting summary)',
        source_url:
          'https://citizenportal.ai/articles/6124779/Memphis-City/Shelby-County/Tennessee/Memphis-City-Council-approves-820000-sale-of-Plant-Road-parcel-amid-community-concerns-over-XAI-data-center-and-water-use',
      },
      {
        id: 'yolanda-cooper-sutton-vote-5',
        date: '2025-04-08',
        item: 'Motion to hold the alcoholic-beverages code rewrite (Ordinance No. 5934) until April 22, 2025',
        position: 'Yes (voted with Smiley, Walker, Warren, White, Canale to hold)',
        source_name: 'Memphis City Council minutes, memphistn.gov',
        source_url: 'http://memphistn.gov/wp-content/uploads/2025/04/Minutes-04-08-25.pdf',
      },
      {
        id: 'yolanda-cooper-sutton-vote-6',
        date: '2026-09-02',
        item: "Said proposed data-center regulations 'fail to address the centers being placed in Black communities'; working with Commissioner Erika Sugarmon on a joint city-county framework",
        position: 'public position',
        source_name: 'Memphis Flyer',
        source_url:
          'https://www.memphisflyer.com/council-hears-data-center-guideline-proposals-as-moratorium-passes-second-reading/',
      },
    ],
    leadership_role: 'none (committee chair only)',
    mayor_alignment:
      "unverified — no public record found of her characterizing her relationship with the Young administration. Her public criticism has been aimed at fellow council members (calling alternative data-center resolutions 'grandstanding') rather than the mayor.",
    name: 'Yolanda Cooper-Sutton',
    notable_quotes: [
      {
        id: 'yolanda-cooper-sutton-quote-1',
        quote:
          "I started working on an ordinance over a year ago and got told we (City Council) couldn't do anything. This body told me I couldn't do it.",
        source_name: 'Commercial Appeal (data-center committee, Sept 2026)',
        source_url:
          'https://www.commercialappeal.com/story/money/business/development/2026/09/01/memphis-city-council-continues-weighing-options-on-data-center-limits-sept-1/91546651007/',
      },
      {
        id: 'yolanda-cooper-sutton-quote-2',
        quote:
          'They live in that community. They are the ones that have been affected for decades.',
        source_name: 'Citizen Portal (Plant Road parcel debate, April 2025)',
        source_url:
          'https://citizenportal.ai/articles/6124779/Memphis-City/Shelby-County/Tennessee/Memphis-City-Council-approves-820000-sale-of-Plant-Road-parcel-amid-community-concerns-over-XAI-data-center-and-water-use',
      },
    ],
    opposition_triggers: [
      "Substitute or alternative proposals she sees as 'grandstanding' that dilute her own regulatory work",
      "Being told by colleagues or staff that the council 'can't' act on something",
      "Projects in Black communities advanced without engagement or answers ('no more stepping on us' sentiment she shares with Green)",
    ],
    persuasion_levers: [
      'Independent research and data she has vetted herself',
      'Strong enforcement mechanisms (fines, sunsets, recertification) rather than voluntary measures',
      'Race-equity framing: which communities bear the burden',
      'Joint city-county approaches (she works with Commissioner Sugarmon)',
    ],
    political_style:
      "Independent, research-driven community advocate. Makes a point of basing votes on her 'own independent researches'; champions libraries, neighborhoods, and youth; has become the council's most persistent voice for regulating data centers, often positioning herself as ahead of — and frustrated with — her colleagues.",
    took_office:
      '2024 (elected October 2023 with 26% in a seven-candidate field; sworn in January 2024)',
    twin_voice:
      "Plainspoken, persistent, and unafraid to call out colleagues: speaks as a neighborhood resident first ('they live in that community'), frames herself as the member who did the homework, and shows visible frustration when the body slow-walks her issues. Example: 'I started working on an ordinance over a year ago and got told we (City Council) couldn't do anything. This body told me I couldn't do it.' — direct, personal, and confrontational toward the institution itself.",
    voting_bloc:
      "unknown — voted with the hold-bloc (Smiley, Walker, Warren, White, Canale) on the alcohol ordinance (April 2025), but she also publicly spars with colleagues (calling Spinosa/Warren resolutions 'grandstanding'), suggesting an independent streak over bloc loyalty.",
  },
  {
    id: 'chase-carlisle',
    bio: "Chase Carlisle is a Memphis real estate professional: senior advisor in the leadership group at Carlisle Corporation (consulting, asset management, development), formerly Director of Real Estate and Development at Carlisle and Executive Vice President of Avison Young; his brother Chance Carlisle is a Memphis real estate developer. He was first elected to the council in 2019 (took office January 2020) and re-elected in October 2023 with 69% of the vote (29,091 votes) to serve through 2027; he sits on the boards of the Memphis Rock 'n Soul Museum, the Memphis Music Hall of Fame, and the Memphis River Parks Partnership, and lives in Memphis with his wife Elizabeth and three children.",
    committees: {
      'Budget Committee': 'Chair',
      'Executive Committee': 'Vice Chair',
      'Health Oversight Commission': 'Liaison (council representative)',
      'Pension Investment Committee': 'Liaison (council representative)',
    },
    data_gaps: [
      "Exact roll-call tally for the August 2025 xAI/Colossus 2 tax-reserve-fund ordinance — reporting confirms council passage and Carlisle's participation, but individual yes/no votes were not published in the sources found.",
      'Committee assignments older than the current official page: BallotProject lists him as Vice Chair of Economic Development, Tourism, & Technology — undated, likely a prior-year assignment; current page lists only Budget Chair, Executive Committee Vice Chair, and two liaisons.',
      "No substantive 2024–2026 record found on: housing policy positions, MATA/transit, education/youth policy beyond the 2023 'youth opportunities' quote, or MLGW/TVA contract positions.",
      'Voting bloc: public sources do not provide consistent roll-call coverage to establish a stable alliance set — listed as unknown.',
      '2027 re-election intentions: not covered in sources found.',
    ],
    district: 'Super District 9, Position 1',
    issue_positions: {
      budget_taxes: {
        evidence:
          "2024: 'Carlisle made an amendment to lower the increase to 49 cents due to cuts... like advertising and publishing and city council travel expenses'; warned that without a balanced budget the city could draw a letter from the Tennessee Comptroller (Commercial Appeal, 6/25/2024).",
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.beaconjournal.com/story/news/government/city/2024/06/25/memphis-2025-budget-tax-increases/74169400007/',
        stance:
          'Budget-chair pragmatist on taxes: he will raise them when he judges the alternative is an unbalanced budget (he shepherded the FY2025 49-cent hike), but his default is to hunt for cuts and revenue re-shuffles first — in 2023 he killed a 29-cent hike by reallocating COVID dollars and other revenues, and in 2026 he opposed any hike for the FY2027 budget.',
      },
      economic_development_pilots: {
        evidence:
          "During the xAI tax-reserve-fund debate he 'cautioned against spreading the tax proceeds thinly between programs and advised keeping the boundaries narrow' (Commercial Appeal, 7/2025). His family/business background is commercial real estate development.",
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.beaconjournal.com/story/news/local/2025/07/08/xai-tax-revenue-memphis-neighborhoods/84504810007/',
        stance:
          'Pro-development but wants community-benefit guardrails and discipline on incentives. With xAI, he backed capturing tax revenue for impacted neighborhoods while warning against diluting it across too many programs.',
      },
      mlgw_utilities: {
        evidence:
          "Appeared on WKNO's 'Behind the Headlines' (2/11/2022) to discuss the council's review of MLGW's ice-storm response and MLGW's research into changing energy sources when its TVA contract ends.",
        source_name: "WKNO/MPTV – 'Behind the Headlines: Memphis City Council' (S12E30, 2/11/2022)",
        source_url: 'https://video.mpt.tv/video/memphis-city-council-9ym9vb/',
        stance:
          "Has exercised council oversight of MLGW's storm response and energy-source planning, but this dates to 2022 and there is little 2024–2026 record found.",
      },
      neighborhoods_services: {
        evidence:
          "Vice Chair Carlisle's remarks at Mayor Young's State of the City address, Feb 10, 2026, as reported by MICAH Memphis.",
        source_name: 'MICAH Memphis',
        source_url:
          'https://www.micahmemphis.org/post/mayor-paul-young-s-state-of-the-city-address',
        stance:
          "Frames tax and budget decisions around visible neighborhood-level services and basic services — during the 2026 State of the City address he highlighted 'repairing roads, upgrading street lighting, and ensuring basic services reach every block of Memphis.'",
      },
      public_safety: {
        evidence:
          'Davis reappointment committee vote (Commercial Appeal, 1/9/2024); 2023 tax-debate quote on investing in youth opportunities (Commercial Appeal, 6/13/2023).',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.ndinsider.com/story/news/local/2024/01/09/memphis-police-chief-c-j-davis-questioned-by-memphis-city-council-reappointment-hearing-paul-young/72157667007/',
        stance:
          "Accountability-oriented on police leadership, and skeptical of using big last-minute budget adds for public-safety programs that bypass process. He voted against recommending Chief C.J. Davis's reappointment in Jan 2024 after tense questioning over enforcement of the post-Tyre Nichols ordinances, yet in 2023 he said he was 'willing to take a couple of darts on an increase' to fund youth opportunities as root-cause investment.",
      },
    },
    key_votes: [
      {
        id: 'chase-carlisle-vote-1',
        date: '2024-06-25',
        item: "FY2025 city budget: 49-cent property tax increase (18.2%) plus solid-waste fee hike to close a ~$64M gap. As budget chair, authored the amendment lowering the mayor's proposed 75-cent increase to 49 cents via cuts, and publicly argued the increases were needed to balance the budget and accelerate Solid Waste's loan repayment 'to the tune of about a million dollars a year.'",
        position: 'Yes',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.beaconjournal.com/story/news/government/city/2024/06/25/memphis-2025-budget-tax-increases/74169400007/',
      },
      {
        id: 'chase-carlisle-vote-2',
        date: '2024-01-09',
        item: "Reappointment of MPD Chief C.J. Davis (committee vote on favorable recommendation) — voted with Smiley, Canale, Swearengen-Washington, Green, Spinosa, and Warren against recommending Davis's reappointment after a tense hearing over enforcement of post-Tyre Nichols ordinances.",
        position: 'No (voted against a favorable recommendation)',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.ndinsider.com/story/news/local/2024/01/09/memphis-police-chief-c-j-davis-questioned-by-memphis-city-council-reappointment-hearing-paul-young/72157667007/',
      },
      {
        id: 'chase-carlisle-vote-3',
        date: '2025-08-19',
        item: 'Ordinance creating a tax reserve fund directing a share of xAI/Colossus 2 property-tax revenue to South Memphis communities — co-designed with Mayor Young; cautioned against spreading the proceeds thinly and advised keeping boundaries narrow.',
        position: 'Yes',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.beaconjournal.com/story/money/business/2025/08/19/elon-musk-xai-in-memphis-tax-reserve-fund/85732791007/',
      },
      {
        id: 'chase-carlisle-vote-4',
        date: '2024-10',
        item: 'Sheraton Hotel purchase — $30M in bonds via Memphis Center City Revenue Finance Corporation, pushed through on same-night minutes. Carlisle was absent for the rushed vote.',
        position: 'Absent / did not vote',
        source_name: 'Smart City Memphis',
        source_url:
          'https://www.smartcitymemphis.com/2024/10/sheraton-hotel-purchase-rushes-to-a-vote-for-some-unstated-reason/comment-page-1/',
      },
      {
        id: 'chase-carlisle-vote-5',
        date: '2026-04',
        item: "Parks & Environment ad hoc committee resolution recommending five-year lease preference for city-owned property — as Vice Chair, supported the resolution as a transparency baseline, arguing it was a preference not an absolute restriction. The resolution failed after Warren's motion to table failed.",
        position: 'Yes',
        source_name: 'Citizen Portal',
        source_url:
          'https://citizenportal.ai/articles/7871690/tennessee/shelby-county/memphis-city/tennessee/shelby-county/memphis-city/tennessee/shelby-county/memphis-city/Memphis-City/Shelby-County/Tennessee/Council-rejects-ad-hoc-recommendations-that-would-favor-five-year-leases-for-city-properties',
      },
      {
        id: 'chase-carlisle-vote-6',
        date: '2026-06-23',
        item: "FY2027 budget: ~$900M budget with employee pay raises, no tax hike. Carlisle, with Edmund Ford Sr., shot down Warren's last-minute proposal for a tax increase to fund the Group Violence Intervention Program, accused Warren of introducing it 'knowing the city council would not pass it,' and — 'making a point about last-minute budget alterations' — hastily moved for a tax increase himself that the council quickly voted down.",
        position: 'Yes (final budget); No to the tax-increase motion',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/news/politics/2026/06/23/memphis-city-council-passes-budget-pay-raises/90650153007/',
      },
    ],
    leadership_role:
      "2026 Vice Chairman of the Memphis City Council (Vice Chair of the Executive Committee; the Council Vice Chair presides over executive session). Verified on the City of Memphis official district page, which states he 'currently serves as the 2026 Vice Chairman of the Memphis City Council' and 'Vice Chair of the Executive Committee.' Vice chairmanship is annual: in April 2025 the chair was J. Ford Canale, and by April 2026 the chair was Jana Swearengen-Washington with Carlisle as vice chair.",
    mayor_alignment: {
      example:
        "During the FY2026 budget fight, Budget Chairman Carlisle and Mayor Young jointly pressed the council for budgetary discipline — Carlisle trying to unwind a surprise $39 million salary increase and Young calling inflated revenue projections 'poor budgeting' and 'bad budget practice' (Smart City Memphis, 5/2025). Carlisle also co-designed with Young the August 2025 xAI/Colossus 2 tax-reserve-fund ordinance, under which a share of xAI property-tax revenue is reserved for South Memphis neighborhoods (Commercial Appeal, 8/19/2025).",
      relationship: 'ally',
      source_name: 'Smart City Memphis; Commercial Appeal',
      source_url:
        'https://www.smartcitymemphis.com/2025/05/there-is-no-holiday-for-memphis-mayor-paul-young/',
    },
    name: 'Chase Carlisle',
    notable_quotes: [
      {
        id: 'chase-carlisle-quote-1',
        context:
          "Remarks as 2026 Council Vice Chair at Mayor Paul Young's State of the City address, Feb 10, 2026",
        quote: "Progress that leaves people behind isn't progress at all.",
        source_name: 'MICAH Memphis',
        source_url:
          'https://www.micahmemphis.org/post/mayor-paul-young-s-state-of-the-city-address',
      },
      {
        id: 'chase-carlisle-quote-2',
        context:
          'As budget chair proposing a status-quo property tax during the FY2024 budget debate, June 2023',
        quote:
          'I believe that we have met the commitments we wanted to as a council for this year without the need for a property tax increase.',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.beaconjournal.com/story/news/local/2023/06/27/memphis-property-tax-stays-flat-public-safety-employees-to-see-base-salary-increase/70348347007/',
      },
    ],
    opposition_triggers: [
      "Last-minute, unvetted budget amendments that bypass committee process — e.g., his attack on Jeff Warren's eleventh-hour Group Violence Intervention Program funding request in June 2026.",
      'Property-tax or fee increases he believes can be avoided through cuts, reallocations, or tighter revenue work — he killed the 2023 29-cent hike and the 2026 hike talk, while backing the 2024 49-cent hike only after exhausting alternatives.',
      "Inflated or speculative revenue projections used to paper over budget gaps — in May 2025 he aligned with Mayor Young in calling such tactics 'poor budgeting'/'bad budget practice' (Smart City Memphis).",
      "Votes rushed through with 'same night minutes' on high-dollar items — he was absent for the October 2024 Sheraton $30M bond vote that drew widespread criticism for its speed.",
      "Unaccountable agency leadership — voted against a favorable recommendation for MPD Chief C.J. Davis's reappointment after challenging her on enforcement of the post-Tyre Nichols ordinances (Jan 2024).",
    ],
    persuasion_levers: [
      'Committee vetting and process: proposals that go through the Budget Committee and fiscal-consent process get his deference; end-runs around it trigger hostility.',
      'Fiscal-discipline framing with math: show how an ask balances without a tax hike, or justify the hike as unavoidable to avoid a Comptroller letter — his FY2025 49-cent hike argument.',
      "Explicit spending plans tied to revenue asks: his standard is that money goes to specific, visible outcomes — he backed the 2024 solid-waste fee because it accelerated loan repayment 'to the tune of about a million dollars a year.'",
      "Youth-opportunity and neighborhood-investment framing: he has said he is 'willing to take a couple of darts on an increase' when the money targets root-cause youth investments (Commercial Appeal, 6/13/2023).",
      'Community-benefit guardrails on development deals: the xAI reserve fund model — capture value for impacted neighborhoods, keep boundaries narrow, council controls distribution.',
    ],
    political_style: {
      archetype: 'Fiscal Steward / Institutional Pragmatist',
      description:
        'A budget-first, numbers-driven operator who governs from the Budget Committee chairmanship and treats process and fiscal discipline as the gate to everything else. He will accept politically painful revenue increases when he believes the math requires it, but fights them when he thinks cuts or revenue re-shuffles suffice — a posture that makes him pragmatic rather than reflexively anti-tax.',
    },
    took_office: 2020,
    twin_voice: {
      example_context:
        "During the FY2027 budget clash (June 2026): after accusing Jeff Warren of introducing a last-minute funding request 'knowing the city council would not pass it,' Carlisle — 'seemingly making a point about last-minute budget alterations' — hastily moved for a tax increase he knew the majority would vote down.",
      example_quote:
        '(Parliamentary gesture rather than a direct quote — his signature move is performative procedure when frustrated.)',
      source_name: 'Commercial Appeal',
      source_url:
        'https://www.commercialappeal.com/story/news/politics/2026/06/23/memphis-city-council-passes-budget-pay-raises/90650153007/',
      style:
        'Measured, dry, numbers-first, with flashes of procedural wit. He speaks like a budget chair: fund balances, revenue projections, loan repayments, and process rules, rather than rhetoric. When frustrated, he performs a pointed parliamentary gesture rather than grandstanding.',
    },
    voting_bloc:
      'unknown — insufficient evidence. Public reporting does not consistently map his roll-call alliances; observed alignments are issue-specific (e.g., with Edmund Ford Sr. opposing tax hikes in 2026; with the council majority on FY2025 budget and the xAI reserve fund), not a stable bloc.',
  },
  {
    id: 'j-ford-canale',
    bio: "East Memphis resident and funeral home business owner (Canale Funeral Directors) who also volunteers as head golf coach at Christian Brothers High School. He entered the council in 2018 when the council appointed him interim member to fill the vacancy left by Philip Spinosa Jr.'s resignation to join the Greater Memphis Chamber; he won the ensuing special election and has been re-elected since, serving continuously since 2018.",
    committees: {
      'Public Safety & Homeland Security Committee': 'Chair',
      'Public Works, Solid Waste, & General Services Committee': 'Vice Chair',
    },
    data_gaps: [
      'Exact date of the Aug. 2018 special election win and his full election history (2019 re-election vote totals) — verified only via secondary summaries.',
      'Full standing-committee roster for 2026 — only Public Safety & Homeland Security (Chair) and Public Works/Solid Waste (Vice Chair) are verified; other memberships (e.g., whether he sits on Budget or Personnel committees) are unverified.',
      'Individual roll-call votes in 2026 (FY2027 budget passage June 23, 2026; data-center moratorium readings) — reported outcomes only, no member-by-member tallies found.',
      'Exact date of Ordinance 5953 (AI property-tax community benefits) passage — citizenportal recap is undated; estimated August 2025.',
      "His individual position on the 2024 49-cent property tax increase — only the solid waste fee vote ('only Spinosa voted against') is attributable to him by implication; the property-tax roll call was not found.",
      'No verifiable evidence found for positions on transit/MATA funding, education/youth programs, or a detailed PILOT-by-PILOT record — omitted rather than guessed.',
      "Two notable quotes come from Citizen Portal, which labels its recaps AI-generated from council video; direct quotes should be spot-checked against the underlying council video before being put in a digital twin's mouth.",
    ],
    district: 'Super District 9, Position 2',
    issue_positions: {
      budget_taxes: {
        evidence:
          "As chairman he shepherded Young's 'intentionally flat' FY2026 budget and the FY2026 tax-levy ordinance to passage without a rate increase; in June 2026 the council passed Young's $898M FY2027 budget with a 2% employee raise and no tax hike.",
        source_name: 'City of Memphis council minutes; Commercial Appeal',
        source_url: 'https://memphistn.gov/wp-content/uploads/2025/06/Minutes-06-10-2025.pdf',
        stance:
          "Fiscal pragmatist who will raise revenue when forced by deficits but prefers flat budgets. Voted for the FY2025 49-cent property tax increase and solid waste fee hike to close a $64M gap, then presided over Young's flat FY2026 budget and the no-increase FY2027 ($900M, June 2026) with pay raises instead.",
      },
      economic_development_pilots: {
        evidence:
          'Voted yes on Ordinance 5953 redirecting AI-infrastructure property-tax revenue to neighborhood public-purpose spending; let the 3-month data-center moratorium advance on consent (Aug. 18, 2026) while the council built a regulatory framework rather than killing development outright.',
        source_name: 'Citizen Portal; Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/money/business/development/2026/08/18/memphis-city-council-approves-temp-data-center-moratorium-on-first-reading-on-consent-agenda/91335785007/',
        stance:
          'Pro-growth and pro-business but responsive to community-benefit pressure: supports frameworks that let development proceed with guardrails rather than blunt bans, and backed the first-of-its-kind mechanism channeling AI-parcel property-tax revenue to affected neighborhoods.',
      },
      housing: {
        evidence:
          'In Sept. 2025 he announced the council would allocate FY2026 budget funds for a down-payment assistance program for potential homebuyers in partnership with the Housing and Community Development office.',
        source_name: 'Citizen Portal',
        source_url:
          'https://citizenportal.ai/articles/7085059/Memphis-City/Shelby-County/Tennessee/Memphis-Council-to-allocate-FY26-funds-for-down-payment-assistance-program',
        stance:
          'Supports homeownership assistance as an affordability lever, pushed as a council priority during his chairmanship.',
      },
      mlgw_utilities: {
        evidence:
          'At a Sept. 1, 2026 committee session he had MLGW CEO Doug McGowen explain the data-center interconnection queue and how TVA capacity charges work so costs are not shifted to ratepayers.',
        source_name: 'rachelandthecity.com',
        source_url: 'https://rachelandthecity.com/who-pays-for-xais-power/',
        stance:
          "Due-diligence interrogator on utility costs: wants MLGW and TVA to explain who pays for data-center load before the council approves anything, aligned with the 'growth should pay for growth' view.",
      },
      neighborhoods_services: {
        evidence:
          'One of 10 co-sponsors of the Jan. 2026 library civil service referendum ordinance (Memphis Flyer); June 2026 budget included a $2,000 one-time bonus for sanitation workers.',
        source_name: 'Memphis Flyer; Commercial Appeal',
        source_url:
          'https://www.memphisflyer.com/library-workers-prepare-for-final-reading-of-city-council-ordinance/',
        stance:
          "Backs frontline services and worker protections: co-sponsored the library workers' civil service referendum and backed sanitation workers during the FY2027 budget fight.",
      },
      public_safety: {
        evidence:
          "Co-sponsored the ordinance putting police/fire residency requirements to voters, arguing: 'We have one goal and only one goal in mind here — to get more men and women to serve the citizens of Memphis'; in his final 2025 chairman address he called public safety 'the foundation upon which opportunity, economic growth, and quality of life are built.'",
        source_name: 'Memphis Flyer; Citizen Portal',
        source_url:
          'https://www.memphisflyer.com/proposed-change-in-fire-police-residency-requirements-amended',
        stance:
          'Public safety is his signature issue and committee chairmanship: staffing, recruitment, and officer support come first. He pushed to loosen police/fire residency rules to widen the recruiting pool and keeps monthly crime updates as a standing committee item.',
      },
    },
    key_votes: [
      {
        id: 'j-ford-canale-vote-1',
        date: '2025-06-10',
        item: 'FY2026 property tax levy ordinance (Ordinance No. 5944), third and final reading — no rate increase, rate held at $3.1954.',
        position: 'Yes',
        source_name: 'City of Memphis council minutes',
        source_url: 'https://memphistn.gov/wp-content/uploads/2025/06/Minutes-06-10-2025.pdf',
      },
      {
        id: 'j-ford-canale-vote-2',
        date: '2025-03-24',
        item: 'Labor impasse ordinance (economic-item arbitration procedure); voted Yes on Smiley amendment streamlining to mediation plus a single reviewer — passed 7-3.',
        position: 'Yes',
        source_name: 'Citizen Portal',
        source_url:
          'https://citizenportal.ai/articles/7731531/tennessee/shelby-county/memphis-city/tennessee/shelby-county/memphis-city/tennessee/shelby-county/memphis-city/tennessee/shelby-county/memphis-city/tennessee/shelby-county/memphis-city/tennessee/shelby-county/memphis-city/Memphis-City/Shelby-County/Tennessee/Council-approves-amended-ordinance-on-arbitration-of-labor-disputes-after-weeks-of-debate',
      },
      {
        id: 'j-ford-canale-vote-3',
        date: '2025-08 (exact date unverified)',
        item: 'Ordinance No. 5953 redirecting property-tax revenue from specified AI-infrastructure parcels to public-purpose neighborhood spending (xAI ROI community benefits).',
        position: 'Yes',
        source_name: 'Citizen Portal',
        source_url:
          'https://citizenportal.ai/articles/6585216/Memphis-City/Shelby-County/Tennessee/Memphis-Council-approves-ordinance-enabling-AI-property-tax-funds-for-community-benefits-adds-1-education-requirement',
      },
      {
        id: 'j-ford-canale-vote-4',
        date: '2024-06-25',
        item: "FY2025 budget package — 49-cent property tax increase (cut from Mayor Young's proposed 75 cents) and solid waste fee increase.",
        position: 'Yes',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.beaconjournal.com/story/news/government/city/2024/06/25/memphis-2025-budget-tax-increases/74169400007/',
      },
      {
        id: 'j-ford-canale-vote-5',
        date: '2026-01 (exact date unverified)',
        item: 'Library workers civil service referendum ordinance (final reading) — co-sponsor.',
        position: 'Yes (co-sponsor)',
        source_name: 'Memphis Flyer',
        source_url:
          'https://www.memphisflyer.com/library-workers-prepare-for-final-reading-of-city-council-ordinance/',
      },
      {
        id: 'j-ford-canale-vote-6',
        date: '2026-08-18',
        item: 'Temporary data-center moratorium ordinance (first reading) — passed on consent agenda amid Chamber opposition and 2026 data-center debate; individual roll-call not recorded in available reporting.',
        position: 'Yes (via consent agenda)',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/money/business/development/2026/08/18/memphis-city-council-approves-temp-data-center-moratorium-on-first-reading-on-consent-agenda/91335785007/',
      },
    ],
    leadership_role:
      'none — NOT still Council Vice Chairman as of 2026. Timeline: Council Vice Chairman during 2024 (under Chairman JB Smiley, Jr.); Council Chairman during 2025; gave farewell as outgoing chairman Dec. 16, 2025, endorsing Jana Swearengen-Washington as chairwoman-elect. As of Jan. 2026: Chairwoman Jana Swearengen-Washington, Vice Chairman Chase Carlisle.',
    mayor_alignment: {
      example:
        "In his final 2025 chairman's address he publicly credited the cooperative relationship with the mayor's office: 'I am especially proud of the partnership between the Memphis City Council and mayor Paul Young's administration. Together, we have demonstrated that progress happens when the legislative and executive branches work collaboratively, not in silos.' He presided as chairman over passage of Young's flat FY2026 budget and its June 2025 tax-levy ordinance without a rate increase.",
      relationship: 'ally',
      source_name: 'Citizen Portal',
      source_url:
        'https://citizenportal.ai/articles/7263247/Memphis-City/Shelby-County/Tennessee/Memphis-Council-Chairman-Ford-Canale-Emphasizes-Public-Safety-Partnership-in-Final-2025-Address',
    },
    name: 'J. Ford Canale',
    notable_quotes: [
      {
        id: 'j-ford-canale-quote-1',
        context:
          'Proposing amendments to the police/fire residency-requirement ordinance he co-sponsored',
        quote:
          "We have one goal and only one goal in mind here — to get more men and women to serve the citizens of Memphis. We're not on a mission to hire people who don't live in Memphis. We're on a mission to put men and women on the street to protect Memphis.",
        source_name: 'Memphis Flyer',
        source_url:
          'https://www.memphisflyer.com/proposed-change-in-fire-police-residency-requirements-amended',
      },
      {
        id: 'j-ford-canale-quote-2',
        context: 'Final recap address as 2025 council chairman',
        quote:
          "I am especially proud of the partnership between the Memphis City Council and mayor Paul Young's administration. Together, we have demonstrated that progress happens when the legislative and executive branches work collaboratively, not in silos.",
        source_name: 'Citizen Portal',
        source_url:
          'https://citizenportal.ai/articles/7263247/Memphis-City/Shelby-County/Tennessee/Memphis-Council-Chairman-Ford-Canale-Emphasizes-Public-Safety-Partnership-in-Final-2025-Address',
      },
    ],
    opposition_triggers: [
      'Measures that shrink the police/fire recruiting pipeline or cut first-responder staffing — he built his council identity on police staffing and sponsored the residency-rule loosening.',
      'Spending proposals framed as messaging rather than services (e.g., his 2018 vote against funding a ballot-question public-information campaign) — pre-2024, included as pattern only.',
      'Development demands that lack answers on who pays for infrastructure — his Sept. 2026 MLGW/TVA questioning and the data-center moratorium pause reflect an insistence on cost-accounting before approval.',
      'Late, surprise fiscal asks without an offsetting revenue plan — observed during the FY2027 budget sparring over last-minute program funding; he presided over flat, disciplined budgets as chairman.',
    ],
    persuasion_levers: [
      'Frame the ask in public-safety terms: staffing, recruitment, officer support, monthly crime accountability.',
      "Show the fiscal math: how it is paid for, who bears infrastructure costs ('growth pays for growth'), and what it does to the fund balance — he voted for tax hikes only when tied to a closed deficit.",
      'Attach enforceable community benefits to development deals (the xAI ROI / Ordinance 5953 model) rather than presenting pure incentives.',
      'Bring business-community and employer backing: he came to the council with Chamber/business-elite support and was appointed with those ties.',
      'Process credibility: consensus committee work, monthly updates, and administration partnership — he praised collaborative governance over silos and publicly endorsed the incoming chair to ensure continuity.',
    ],
    political_style: {
      archetype: 'Business-friendly public-safety institutionalist',
      description:
        'A Chamber-adjacent, pro-business East Memphis centrist whose dominant lens is public safety staffing and service delivery, not ideology. As chairman he emphasized partnership and process stewardship over confrontation, presiding over flat budgets and trying to attach community benefits to development rather than blocking it.',
    },
    took_office: 2018,
    twin_voice: {
      example_context: 'Final recap address as 2025 chairman.',
      example_quote:
        'This marks my final recap as chairman of the Memphis City Council in 2025. ... Public safety has been at the center of that work. It is the foundation upon which opportunity, economic growth, and quality of life are built.',
      source_name: 'Citizen Portal',
      source_url:
        'https://citizenportal.ai/articles/7263247/Memphis-City/Shelby-County/Tennessee/Memphis-Council-Chairman-Ford-Canale-Emphasizes-Public-Safety-Partnership-in-Final-2025-Address',
      style:
        "Plainspoken, pragmatic, and relentlessly on-message: in meetings he talks like an operations manager, not an orator — short declarative sentences, single-goal framing ('one goal and only one goal'), and frequent credit-sharing with colleagues, the administration, and residents. As chairman his recaps were stewardship speeches about responsibility, public safety as 'the foundation,' and council-mayor partnership.",
    },
    voting_bloc:
      'unknown — too thin to name a durable bloc. One data point: on the March 24, 2025 labor-arbitration amendment he voted with the Smiley/Ford/Spinosa/Walker/Warren majority (7-3); on the FY2025 solid waste fee he voted with the near-unanimous majority (only Spinosa dissented).',
  },
  {
    id: 'jeff-warren',
    bio: 'Dr. Jeff Warren is a family medicine physician (Yale undergraduate, Duke Medical School) at Memphis Internal Medicine and Pediatrics and a medical director for area assisted-living and rehab facilities; he moved to Memphis in 1989 and has lived in Super District 9 for 30+ years. He served two terms on the Memphis City School Board (2005-2013) before being elected to the City Council in November 2019 and sworn in January 2020; he was re-elected unopposed in October 2023.',
    committees: {
      'Parks & Environment Committee': 'Chair',
      'Public Works, Solid Waste & General Services Committee': 'Vice Chair',
    },
    data_gaps: [
      'Party affiliation — Memphis municipal races are nonpartisan; his 2019 steering committee spanned both parties (co-chairs included Democratic Congressman Steve Cohen). Unverified which party he votes with.',
      'His individual vote on the June 2024 49-cent property tax increase — unverified (only the co-sponsored citation-abatement alternative is documented).',
      "His final vote on the Lee Harris street renaming — 'pushback' is documented but his recorded vote is unverified.",
      'Reason for his April 22, 2025 recusal on the Stage Road rezoning — unverified (conflict of interest is inferred, not stated in the minutes).',
      'Full 2026 committee membership list — only Chair (Parks & Environment) and Vice Chair (Public Works/Solid Waste) are agenda-verified; his official city page also claims Vice-Chair of Public Safety and liaison roles for the Memphis Zoo and Memphis Shelby Crime Commission, but current committee agendas contradict the Public Safety claim, so these are unverified/outdated.',
      'Position on MLGW rates/utilities — no specific Warren statements found; omitted.',
      'Position on transit/MATA — no specific Warren statements found; omitted.',
      'Position on education/youth policy in office — only his school-board biography is documented; no recent council actions found; omitted.',
    ],
    district: 'Super District 9, Position 3',
    issue_positions: {
      budget_taxes: {
        evidence:
          "During the June 2026 budget committee debate over GVIP funding, Warren 'raised the prospect of raising taxes' and said the council has 'underfunded our city for 25 years'; Councilmen Carlisle and Ford Sr. shot the idea down.",
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/news/politics/2026/06/23/memphis-city-council-passes-budget-pay-raises/90650153007/',
        stance:
          "Warren is fiscally pragmatic rather than anti-tax or pro-tax: in 2024 he co-sponsored a citation-abatement amnesty to avoid Mayor Young's 75-cent property tax hike (which the council ultimately cut to 49 cents), but in June 2026, leading a push for Group Violence Intervention Program funding, he openly raised the prospect of a tax increase, arguing it is 'impossible for the city to cut its way to improvement.'",
      },
      economic_development_pilots: {
        evidence:
          "Warren proposed the three-month pause during the Aug 18, 2026 committee session; in September he presented his regulatory framework and defended his resolution 'as a way to find clean energy solutions for a growing industry.'",
        source_name: 'Commercial Appeal / Memphis Flyer',
        source_url:
          'https://www.commercialappeal.com/story/money/business/development/2026/09/01/memphis-city-council-continues-weighing-options-on-data-center-limits-sept-1/91546651007/',
        stance:
          "Warren is pro-development but conditional: he defended data center growth as 'a positive for job creation and tax revenue' while insisting on guardrails. He proposed a three-month pause on new data centers and a framework banning facilities with large evaporative or local water withdrawals, requiring public disclosure, penalties, and enforcement for expansions — a middle path between the Chamber's opposition to any moratorium and activists' demand for a hard stop.",
      },
      housing: {
        evidence:
          "March 25, 2025 council minutes: 'MOTION: Warren SECOND: Spinosa' on the $2.23M Accelerate Memphis transfer — AYES included Warren; approved.",
        source_name: 'City of Memphis council minutes (March 25, 2025)',
        source_url: 'https://memphistn.gov/wp-content/uploads/2025/04/Minutes-03-25-25.pdf',
        stance:
          'Warren supports reprogramming existing funds toward neighborhood-level housing and community assets: in March 2025 he made the motion (approved) to transfer ~$2.23M in Accelerate Memphis funds to community center maintenance and Pine Hill/Frayser playgrounds, and voted yes on reallocating $1.5M within the Accelerate Memphis Affordable Housing Investment project.',
      },
      neighborhoods_services: {
        evidence:
          "September 2026 Commercial Appeal budget recap: council 'approved some big spending projects for a few of the city's public parks,' including the $4M Audubon clubhouse allocation and the Gooch Park grant, under Warren's committee purview.",
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/news/politics/2026/09/02/mlgw-storm-cleanup-cost-estimate/91515532007/',
        stance:
          'As Parks & Environment chairman, Warren is a parks champion who favors tangible capital investment with defined projects: his committee advanced the $4M Audubon Golf Clubhouse construction, a $3M+ National Park Service grant for Gooch Park improvements, $300K for Memphis Animal Services renovations, and a FY27 CIP amendment adding $1.5M for Memphis Zoo major maintenance.',
      },
      public_safety: {
        evidence:
          "His January 2024 resolution postponed the Davis reappointment vote until June 2024 and required the council chairman to compile 'a list of expectations and metrics for the next 5 months' to assess her crime-reduction performance before any reappointment vote.",
        source_name: 'Memphis Flyer',
        source_url: 'https://memphis-cms.altnuxt.com/category/politics/page/14/',
        stance:
          "Warren is a public-safety hawk with an accountability bent: he led the council's Group Violence Intervention Program funding effort in 2026, voted yes on the December 2025 firefighter raise, and in 2024 made the Davis reappointment contingent on measurable performance metrics rather than a rubber stamp.",
      },
    },
    key_votes: [
      {
        id: 'jeff-warren-vote-1',
        date: '2024-01',
        item: 'Resolution postponing the vote on reappointment of MPD Chief C.J. Davis until June 2024 pending 5-month performance metrics.',
        position: 'Sponsor (public position)',
        source_name: 'Memphis Flyer',
        source_url: 'https://memphis-cms.altnuxt.com/category/politics/page/14/',
      },
      {
        id: 'jeff-warren-vote-2',
        date: '2024-05',
        item: "One-month citation abatement/amnesty program to raise revenue as an alternative to Mayor Young's proposed 75-cent property tax increase — co-proposer (with Smiley, Green, Swearengen-Washington, Easter-Thomas).",
        position: 'Co-proposer (public position)',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.beaconjournal.com/story/news/politics/2024/05/27/memphis-city-council-unions-budget/73632267007/',
      },
      {
        id: 'jeff-warren-vote-3',
        date: '2025-03-25',
        item: 'Resolution transferring ~$2.23M in Accelerate Memphis funds to community center maintenance (PKA1401) and Pine Hill/Frayser playgrounds (PKA1213) — motion maker; approved.',
        position: 'Yes',
        source_name: 'City of Memphis council minutes (March 25, 2025)',
        source_url: 'https://memphistn.gov/wp-content/uploads/2025/04/Minutes-03-25-25.pdf',
      },
      {
        id: 'jeff-warren-vote-4',
        date: '2025-04-22',
        item: 'Zoning reclassification of 7073-7117 Stage Road from Conservation Agriculture to Commercial Mixed-Use-2 (Ordinance 5939) — made a formal statement of recusal.',
        position: 'Abstain',
        source_name: 'City of Memphis council minutes (April 22, 2025)',
        source_url: 'https://memphistn.gov/wp-content/uploads/2025/05/Minutes-04-22-25.pdf',
      },
      {
        id: 'jeff-warren-vote-5',
        date: '2025-08',
        item: 'Substitute Ordinance 5,953 — redirecting property-tax revenue from specified AI/data-center parcels to public-purpose neighborhood spending (with 1% education requirement) — recorded in unanimous roll-call final passage.',
        position: 'Yes',
        source_name: 'Citizen Portal',
        source_url:
          'https://citizenportal.ai/articles/6585216/Memphis-City/Shelby-County/Tennessee/Memphis-Council-approves-ordinance-enabling-AI-property-tax-funds-for-community-benefits-adds-1-education-requirement',
      },
      {
        id: 'jeff-warren-vote-6',
        date: '2025-12-16',
        item: 'Resolution approving additional 2% raise for Memphis firefighters ($1.77M, restoring the two-year raise plan) — voted in the 8-3-2 majority.',
        position: 'Yes',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.beaconjournal.com/story/news/local/2025/12/16/memphis-city-council-passes-firefighter-raises/87777419007/',
      },
      {
        id: 'jeff-warren-vote-7',
        date: '2026-08/09',
        item: "Temporary data-center moratorium and Warren's own regulatory framework (ban on large evaporative/local water withdrawal, disclosure, penalties, enforcement) — proposed a three-month pause and presented the regulatory framework; supported the moratorium process while defending data centers for jobs/tax revenue.",
        position: 'Sponsor (public position)',
        source_name: 'Commercial Appeal / Memphis Flyer',
        source_url:
          'https://www.memphisflyer.com/council-hears-data-center-guideline-proposals-as-moratorium-passes-second-reading/',
      },
    ],
    leadership_role:
      'none — council-wide leadership as of 2026: Chairwoman Jana Swearengen-Washington, Vice Chairman Chase Carlisle (per Jan 13, 2026 council recap and April 14, 2026 minutes). Warren holds no full-council leadership post.',
    mayor_alignment: {
      example:
        "In January 2024, days into Mayor Paul Young's term, Warren prepared a council resolution calling for a five-month pause on the reappointment of Police Chief C.J. Davis, with a yet-to-be-devised set of performance metrics; with eight members reportedly committed, Mayor Young preemptively appointed Davis interim chief minutes before its introduction — the council's counterbalance move, with Warren described by the Memphis Flyer as having 'affirmed his position at the nexus of authority.'",
      relationship: 'independent',
      source_name: 'Memphis Flyer',
      source_url: 'https://memphis-cms.altnuxt.com/category/politics/page/14/',
    },
    name: 'Jeff Warren',
    notable_quotes: [
      {
        id: 'jeff-warren-quote-1',
        context:
          "Presenting his data-center regulatory framework as the council's moratorium passed second reading, September 2026.",
        quote:
          "My thinking is what everyone really wants is that we don't want these things coming in where we can't say how they're using our resources. We don't want to be a data center desert.",
        source_name: 'Memphis Flyer',
        source_url:
          'https://www.memphisflyer.com/council-hears-data-center-guideline-proposals-as-moratorium-passes-second-reading/',
      },
      {
        id: 'jeff-warren-quote-2',
        context:
          'Budget committee debate, June 2026, while leading the push for Group Violence Intervention Program funding and raising the prospect of a tax increase.',
        quote:
          'It was impossible for the city to cut its way to improvement... [the City Council has] underfunded our city for 25 years.',
        source_name: 'Commercial Appeal',
        source_url:
          'https://www.commercialappeal.com/story/news/politics/2026/06/23/memphis-city-council-passes-budget-pay-raises/90650153007/',
      },
    ],
    opposition_triggers: [
      "Rubber-stamp reappointments without accountability — he forced a metrics-based pause on Chief Davis's reappointment rather than approving it outright (Jan 2024).",
      'Development without disclosure or guardrails — he conditioned support for data centers on water-use bans, public disclosure, penalties, and enforcement (Aug-Sep 2026).',
      'Ceremonial/legacy spending without scrutiny — he pushed back (with Edmund Ford Sr.) on renaming Union Avenue for former Mayor Lee Harris (Sept 2026).',
      "Cuts-only budgeting — he rejects the premise that the city can 'cut its way to improvement' and will float revenue increases rather than starve programs (June 2026 GVIP debate).",
      "Surprise or opaque process — consistent with his metrics demands, he reacts poorly to being left in the dark (echoed in colleagues' complaints about learning of xAI's third data center 'in the newspaper').",
    ],
    persuasion_levers: [
      'Hard data and measurable outcomes — as a physician he reaches first for metrics and evaluations (the Davis 5-month metrics framework).',
      'Public-health and public-safety framing — his strongest advocacy is for the Group Violence Intervention Program and first-responder pay.',
      'Parks and community-asset investment with concrete, costed projects — his committee lane, where he moves money (Audubon, Gooch Park, zoo maintenance).',
      "Jobs + tax revenue arguments for development — he defended data centers as a 'positive for job creation and tax revenue,' so economic-benefit evidence lands.",
      'Coalition cover from peers — his big moves (citation abatement, GVIP) are launched alongside Smiley/Green allies rather than solo.',
    ],
    political_style: {
      archetype: 'The Physician-Legislator — a data-driven pragmatist',
      description:
        "Warren diagnoses policy problems and prescribes measured, metrics-based interventions rather than leading with ideology; he frames issues in public-health and fiscal-health terms (e.g., demanding performance metrics before reappointing the police chief). He is an independent institutionalist: willing to challenge the mayor's office on oversight and to float tax increases for programs he champions, but averse to rubber-stamping development, ceremonial spending, or blank-check budgets.",
    },
    took_office: 2020,
    twin_voice: {
      example_context: 'Memphis Flyer, Sept 2026.',
      example_quote:
        "My thinking is what everyone really wants is that we don't want these things coming in where we can't say how they're using our resources. We don't want to be a data center desert.",
      source_name: 'Memphis Flyer',
      source_url:
        'https://www.memphisflyer.com/council-hears-data-center-guideline-proposals-as-moratorium-passes-second-reading/',
      style:
        "Warren talks in meetings like a doctor presenting a diagnosis: plain-spoken, clinical, and prescriptive, reaching for measurable outcomes rather than rhetoric (the Memphis Flyer once noted he 'dispatched a prescription of sorts to constituents via email' during COVID). He asks questions and proposes frameworks, then speaks in short, quotable verdicts.",
    },
    voting_bloc:
      'unknown — vote-level evidence is thin, but on the recorded splits he has voted with the majority coalition of Canale, Smiley, Spinosa, Green, and Swearengen-Washington (e.g., the Dec 2025 firefighter raise passed 8-3-2 with Warren in the yes bloc alongside Easter-Thomas, Ford Sr., Smiley, Canale, Spinosa, Swearengen-Washington, and Green; Carlisle, Cooper-Sutton, and Walker voted no). His most frequent collaborators are JB Smiley Jr. and Jerri Green, with whom he co-sponsored the 2024 citation-abatement alternative to the tax hike.',
  },
];

export const members = memberListSchema.parse(rawMembers);
