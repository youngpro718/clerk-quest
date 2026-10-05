/* Authored card-face typography. Content remains owned by the card data; quoteLines
   supplies presentation-only line breaks using the same words and punctuation. */
window.CQ_CARD_TYPOGRAPHY = {
  // Classic frame: Series 1
  gavel:       { firstSize:10.0, secondSize:11.8, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.025em', secondLetterSpacing:'.045em', quoteSize:6.1, quoteLines:['Same court.','More cases.'] },
  paperjam:    { firstSize:10.6, secondSize:11.6, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.035em', secondLetterSpacing:'.04em', quoteSize:5.7, quoteLines:['I simply cannot','process this.'] },
  missingfile: { firstSize:9.6, secondSize:11.2, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.025em', secondLetterSpacing:'.035em', quoteSize:5.7, quoteLines:['It was here a','second ago.'] },
  summons:     { firstSize:6.7, secondSize:11.7, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.14em', secondLetterSpacing:'.045em', quoteSize:5.9, quoteLines:["You've been",'expected.'] },
  motion:      { firstSize:6.7, secondSize:12.0, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.14em', secondLetterSpacing:'.055em', quoteSize:5.6, quoteLines:['Always moving.','Rarely finished.'] },
  affidavit:   { firstSize:6.7, secondSize:10.8, fontFirst:'Luckiest Guy', fontSecond:'Bangers', firstLetterSpacing:'.14em', secondLetterSpacing:'.055em', quoteSize:6.0, quoteLines:['I swear.','Literally.'] },
  adjournment: { firstSize:6.6, secondSize:9.4, fontFirst:'Luckiest Guy', fontSecond:'Bangers', firstLetterSpacing:'.14em', secondLetterSpacing:'.025em', quoteSize:6.5, quoteLines:['Not today.'] },
  calendarcall:{ firstSize:10.4, secondSize:12.0, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.035em', secondLetterSpacing:'.08em', quoteSize:6.0, quoteLines:['Is the party','present?'] },
  judgment:    { firstSize:6.7, secondSize:11.1, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.14em', secondLetterSpacing:'.04em', quoteSize:6.5, quoteLines:["It's decided."] },

  // Classic frame: standalone Memory Tricks
  svs:              { firstSize:9.4, secondSize:11.1, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.02em', secondLetterSpacing:'.035em', quoteSize:5.5, quoteLines:["You're IN vs.","You're NEEDED."] },
  whosigns:         { firstSize:8.2, secondSize:11.0, fontFirst:'Bangers', fontSecond:'Luckiest Guy', firstLetterSpacing:'.045em', secondLetterSpacing:'.035em', quoteSize:5.4, quoteLines:['Judge or Clerk.','The Court signs.'] },
  clock6090:        { firstSize:9.1, secondSize:12.0, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.025em', secondLetterSpacing:'.07em', quoteSize:5.6, quoteLines:['Start in 60.','Finish in 90.'] },
  ypsi:             { firstSize:9.8, secondSize:10.1, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.025em', secondLetterSpacing:'.02em', quoteSize:5.2, quoteLines:['Investigate first.','Decide at sentence.'] },
  eightdays:        { firstSize:10.8, secondSize:11.9, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.04em', secondLetterSpacing:'.07em', quoteSize:5.4, quoteLines:['Serve it 8 days','before you appear.'] },
  sealed:           { firstSize:10.1, secondSize:10.6, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.03em', secondLetterSpacing:'.025em', quoteSize:5.3, quoteLines:['Case ends in your','favor? Seal it.'] },
  followpetitioner: { firstSize:9.4, secondSize:9.5, fontFirst:'Luckiest Guy', fontSecond:'Bangers', firstLetterSpacing:'.025em', secondLetterSpacing:'.045em', quoteSize:5.5, quoteLines:['The order goes','where they live.'] },
  amendonce:        { firstSize:9.2, secondSize:8.8, fontFirst:'Luckiest Guy', fontSecond:'Bangers', firstLetterSpacing:'.02em', secondLetterSpacing:'.025em', quoteSize:5.8, quoteLines:['Twenty, before,','twenty.'] },
  childvoice:       { firstSize:7.9, secondSize:10.4, fontFirst:'Bangers', fontSecond:'Luckiest Guy', firstLetterSpacing:'.035em', secondLetterSpacing:'.025em', quoteSize:6.0, quoteLines:['Good Parents','Obey.'] },
  custodyornot:     { firstSize:10.4, secondSize:11.6, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.035em', secondLetterSpacing:'.06em', quoteSize:5.6, quoteLines:['Custody at issue?','It counts.'] },
  lfm:              { firstSize:9.4, secondSize:11.2, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.025em', secondLetterSpacing:'.05em', quoteSize:5.8, quoteLines:['Last. First.','Middle.'] },
  caseorder:        { firstSize:9.0, secondSize:9.8, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.025em', secondLetterSpacing:'.025em', quoteSize:5.7, quoteLines:['The life of a','case, in order.'] },

  // Classic frame: Series 2
  jurywaiver:  { firstSize:11.7, secondSize:11.1, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.07em', secondLetterSpacing:'.035em', quoteSize:5.2, quoteLines:['Write it. Sign it.','Judge approves it.'] },
  interest:    { firstSize:8.8, secondSize:12.0, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.02em', secondLetterSpacing:'.07em', quoteSize:5.2, quoteLines:['Judgment? Entry.','Order? Docketing.'] },
  quash:       { firstSize:8.1, secondSize:10.6, fontFirst:'Bangers', fontSecond:'Luckiest Guy', firstLetterSpacing:'.035em', secondLetterSpacing:'.02em', quoteSize:5.2, quoteLines:['Fight the subpoena','where it returns.'] },
  newtrial:    { firstSize:10.4, secondSize:12.0, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.025em', secondLetterSpacing:'.08em', quoteSize:5.4, quoteLines:['Any time during','trial. Any party.'] },
  schoolnotice:{ firstSize:7.8, secondSize:9.9, fontFirst:'Bangers', fontSecond:'Luckiest Guy', firstLetterSpacing:'.035em', secondLetterSpacing:'.025em', quoteSize:5.0, quoteLines:['Under 19 + sentenced','= school is told.'] },
  bail:        { firstSize:9.3, secondSize:11.1, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.025em', secondLetterSpacing:'.04em', quoteSize:6.0, quoteLines:['Cash, bond,','or card.'] },
  acd:         { firstSize:9.9, secondSize:12.0, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.025em', secondLetterSpacing:'.1em', quoteSize:5.5, quoteLines:['Adjust it all you','want. Max: 12.'] },
  military:    { firstSize:8.7, secondSize:10.1, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.02em', secondLetterSpacing:'.025em', quoteSize:5.0, quoteLines:['Serving, unavailable,','no good deposition.'] },

  // Series 3: shallow title and quote bands
  eightback:   { firstSize:4.9, secondSize:6.1, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.025em', secondLetterSpacing:'.045em', quoteSize:3.8, quoteLines:['Eight days out.','Two days back.'] },
  reargue:     { firstSize:5.2, secondSize:6.2, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.025em', secondLetterSpacing:'.06em', quoteSize:3.9, quoteLines:['You missed it.','Look again.'] },
  renew:       { firstSize:5.3, secondSize:5.8, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.035em', secondLetterSpacing:'.025em', quoteSize:3.4, quoteLines:['Found something new.',"Here's why it's late."] },
  sj120:       { firstSize:5.4, secondSize:5.4, fontFirst:'Luckiest Guy', fontSecond:'Bangers', firstLetterSpacing:'.045em', secondLetterSpacing:'.035em', quoteSize:3.8, quoteLines:['Note filed.',"Clock's running."] },
  undodefault: { firstSize:4.7, secondSize:5.2, fontFirst:'Luckiest Guy', fontSecond:'Bangers', firstLetterSpacing:'.015em', secondLetterSpacing:'.02em', quoteSize:3.5, quoteLines:['Both sides agree?',"I'll undo it."] },
  freeze:      { firstSize:4.8, secondSize:6.0, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.015em', secondLetterSpacing:'.035em', quoteSize:3.9, quoteLines:['Nobody moves','that money.'] },
  appeal30:    { firstSize:4.2, secondSize:6.2, fontFirst:'Bangers', fontSecond:'Luckiest Guy', firstLetterSpacing:'.025em', secondLetterSpacing:'.08em', quoteSize:3.8, quoteLines:['Serve it. File it.','Thirty days.'] },

  // Series 4: tall first placard, compact second placard
  qr_cpl_001_criminal_action:      { firstSize:7.2, secondSize:5.5, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.1em', secondLetterSpacing:'.06em', quoteSize:4.6, quoteLines:['File to finish'] },
  qr_cpl_011_superior_jurisdiction:{ firstSize:6.0, secondSize:5.5, fontFirst:'Bangers', fontSecond:'Luckiest Guy', firstLetterSpacing:'.035em', secondLetterSpacing:'.1em', quoteSize:4.0, quoteLines:['Felony trial','goes upstairs'] },
  qr_cpl_013_limitations:          { firstSize:7.2, secondSize:5.5, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.1em', secondLetterSpacing:'.07em', quoteSize:4.0, quoteLines:['Baseline, then','exceptions'] },
  qr_cpl_016_facial_sufficiency:   { firstSize:7.2, secondSize:5.5, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.1em', secondLetterSpacing:'.07em', quoteSize:3.8, quoteLines:['Instrument first,','test second'] },
  qr_cpl_020_arrest_warrant_issue: { firstSize:6.9, secondSize:5.5, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.055em', secondLetterSpacing:'.1em', quoteSize:4.4, quoteLines:['Test before warrant'] },
  qr_cpl_028_grand_jury_numbers:   { firstSize:7.2, secondSize:5.3, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.12em', secondLetterSpacing:'.05em', quoteSize:4.0, quoteLines:['Sixteen in,','twelve agree'] },
  qr_cpl_033_pleas:                { firstSize:7.2, secondSize:5.5, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.12em', secondLetterSpacing:'.09em', quoteSize:3.9, quoteLines:['Whole differs','from partial'] },
  qr_cpl_034_jury_trial_order:     { firstSize:7.2, secondSize:5.5, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.12em', secondLetterSpacing:'.09em', quoteSize:3.5, quoteLines:['People open first;','defense sums first'] },
  qr_cpl_039_jury_notes:           { firstSize:7.2, secondSize:5.5, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.12em', secondLetterSpacing:'.09em', quoteSize:3.8, quoteLines:['Notice, presence,','response'] },
  qr_cpl_041_set_aside_verdict:    { firstSize:6.8, secondSize:5.5, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.05em', secondLetterSpacing:'.12em', quoteSize:3.8, quoteLines:['Verdict to','sentence window'] },
  qr_cpl_045_sentence_timing:      { firstSize:6.6, secondSize:5.4, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.045em', secondLetterSpacing:'.06em', quoteSize:4.1, quoteLines:['No unreasonable','delay'] },
  qr_cpl_063_order_examination:    { firstSize:7.2, secondSize:5.5, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.12em', secondLetterSpacing:'.14em', quoteSize:3.9, quoteLines:['Concern triggers','examination'] },

  // Series 5: two balanced lines in one generous title field
  qr_pl_064_offense_grades:     { firstSize:7.4, secondSize:7.8, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.045em', secondLetterSpacing:'.055em', quoteSize:3.8, quoteLines:['Fifteen days,','one year'] },
  qr_pl_065_person:             { firstSize:6.6, secondSize:8.0, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.14em', secondLetterSpacing:'.1em', quoteSize:4.0, quoteLines:['People and','entities'] },
  qr_pl_066_classifications:    { firstSize:7.2, secondSize:7.2, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.045em', secondLetterSpacing:'.035em', quoteSize:3.6, quoteLines:['A–E; A, B,','unclassified'] },
  qr_pl_067_designation:        { firstSize:7.8, secondSize:8.0, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.1em', secondLetterSpacing:'.11em', quoteSize:3.2, quoteLines:['Designation and sentence','are different paths'] },
  qr_pl_068_felony_fines:       { firstSize:7.8, secondSize:8.0, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.08em', secondLetterSpacing:'.12em', quoteSize:3.4, quoteLines:['General rule, then','special ceiling'] },
  qr_pl_069_nonfelony_fines:    { firstSize:7.2, secondSize:6.9, fontFirst:'Luckiest Guy', fontSecond:'Bangers', firstLetterSpacing:'.04em', secondLetterSpacing:'.035em', quoteSize:3.1, quoteLines:['One thousand, five hundred,','two fifty'] },
  s5_concept_minor_mischief:    { firstSize:7.8, secondSize:7.5, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.09em', secondLetterSpacing:'.045em', quoteSize:3.8, quoteLines:['Offense, but','not crime'] },
  s5_concept_split_verdict:     { firstSize:7.8, secondSize:7.5, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.1em', secondLetterSpacing:'.055em', quoteSize:3.7, quoteLines:['Range first;','class second'] },
  s5_concept_felony_titan:      { firstSize:7.7, secondSize:8.0, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.055em', secondLetterSpacing:'.1em', quoteSize:3.6, quoteLines:['Over one year;','classes A–E'] },
  s5_concept_the_aces:          { firstSize:6.7, secondSize:8.0, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.14em', secondLetterSpacing:'.12em', quoteSize:3.9, quoteLines:['Class A splits','in two'] },
  s5_concept_triple_take:       { firstSize:7.7, secondSize:8.0, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.08em', secondLetterSpacing:'.12em', quoteSize:3.5, quoteLines:['Article 496 can reach','triple gain'] },
  s5_concept_vault_voltage:     { firstSize:7.8, secondSize:7.3, fontFirst:'Luckiest Guy', fontSecond:'Luckiest Guy', firstLetterSpacing:'.1em', secondLetterSpacing:'.04em', quoteSize:4.1, quoteLines:['100, 50, 30, 15'] }
};
