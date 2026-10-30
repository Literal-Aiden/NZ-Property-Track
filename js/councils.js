// Which council a property is in, and a link to that council's rates search.
// Councils don't share a rates database, and many block automated lookups, so the app links out instead of fetching rates.
// Each council: name, website, words that identify it in an address (council name first, then main towns), and a direct
// rates search page where one is known ({q} is replaced with the address). Without one, the link searches the council's site.
var COUNCILS=[
  ['Far North District Council','fndc.govt.nz','far north|kerikeri|kaitaia|kaikohe|paihia|russell'],
  ['Whangārei District Council','wdc.govt.nz','whangarei'],
  ['Kaipara District Council','kaipara.govt.nz','kaipara|dargaville|mangawhai'],
  ['Auckland Council','aucklandcouncil.govt.nz','auckland'],
  ['Thames-Coromandel District Council','tcdc.govt.nz','thames-coromandel|thames|coromandel|whitianga|whangamata|pauanui'],
  ['Hauraki District Council','hauraki-dc.govt.nz','hauraki|paeroa|waihi|ngatea'],
  ['Waikato District Council','waikatodistrict.govt.nz','waikato district|ngaruawahia|huntly|pokeno|raglan|tuakau|te kauwhata'],
  ['Matamata-Piako District Council','mpdc.govt.nz','matamata-piako|matamata|morrinsville|te aroha'],
  ['Hamilton City Council','hamilton.govt.nz','hamilton'],
  ['Waipā District Council','waipadc.govt.nz','waipa|te awamutu|cambridge'],
  ['Ōtorohanga District Council','otodc.govt.nz','otorohanga'],
  ['South Waikato District Council','southwaikato.govt.nz','south waikato|tokoroa|putaruru|tirau'],
  ['Waitomo District Council','waitomo.govt.nz','waitomo|te kuiti'],
  ['Taupō District Council','taupodc.govt.nz','taupo|turangi'],
  ['Western Bay of Plenty District Council','westernbay.govt.nz','western bay of plenty|te puke|katikati|waihi beach|omokoroa'],
  ['Tauranga City Council','tauranga.govt.nz','tauranga|mount maunganui|papamoa'],
  ['Rotorua Lakes Council','rotorualakescouncil.nz','rotorua'],
  ['Whakatāne District Council','whakatane.govt.nz','whakatane|ohope|edgecumbe'],
  ['Kawerau District Council','kaweraudc.govt.nz','kawerau'],
  ['Ōpōtiki District Council','odc.govt.nz','opotiki'],
  ['Gisborne District Council','gdc.govt.nz','gisborne|tairawhiti|wainui|tolaga bay|ruatoria','https://rid.gdc.govt.nz/search?query={q}'],
  ['Wairoa District Council','wairoadc.govt.nz','wairoa'],
  ['Hastings District Council','hastingsdc.govt.nz','hastings|havelock north|flaxmere'],
  ['Napier City Council','napier.govt.nz','napier|taradale','https://www.napier.govt.nz/services/properties-and-rates/rates/'],
  ['Central Hawke’s Bay District Council','chbdc.govt.nz','central hawke|waipukurau|waipawa'],
  ['New Plymouth District Council','npdc.govt.nz','new plymouth|waitara|inglewood|oakura'],
  ['Stratford District Council','stratford.govt.nz','stratford'],
  ['South Taranaki District Council','southtaranaki.com','south taranaki|hawera|patea|opunake|eltham'],
  ['Ruapehu District Council','ruapehudc.govt.nz','ruapehu|taumarunui|ohakune|raetihi|national park'],
  ['Whanganui District Council','whanganui.govt.nz','whanganui|wanganui'],
  ['Rangitīkei District Council','rangitikei.govt.nz','rangitikei|marton|taihape|bulls'],
  ['Manawatū District Council','mdc.govt.nz','manawatu district|feilding'],
  ['Palmerston North City Council','pncc.govt.nz','palmerston north'],
  ['Tararua District Council','tararuadc.govt.nz','tararua|dannevirke|pahiatua|woodville|eketahuna'],
  ['Horowhenua District Council','horowhenua.govt.nz','horowhenua|levin|foxton|shannon'],
  ['Kāpiti Coast District Council','kapiticoast.govt.nz','kapiti|paraparaumu|waikanae|otaki|raumati|paekakariki','https://www.kapiticoast.govt.nz/propertyhousingandrates/rates/property-search/'],
  ['Porirua City Council','poriruacity.govt.nz','porirua|whitby|titahi bay'],
  ['Upper Hutt City Council','upperhutt.govt.nz','upper hutt'],
  ['Hutt City Council','huttcity.govt.nz','hutt city|lower hutt|petone|wainuiomata|eastbourne'],
  ['Wellington City Council','wellington.govt.nz','wellington city|wellington','https://wellington.govt.nz/property-rates-and-building/property/property-search'],
  ['Masterton District Council','mstn.govt.nz','masterton'],
  ['Carterton District Council','cdc.govt.nz','carterton'],
  ['South Wairarapa District Council','swdc.govt.nz','south wairarapa|martinborough|featherston|greytown'],
  ['Tasman District Council','tasman.govt.nz','tasman|richmond|motueka|takaka|mapua|brightwater'],
  ['Nelson City Council','nelson.govt.nz','nelson|stoke'],
  ['Marlborough District Council','marlborough.govt.nz','marlborough|blenheim|picton|renwick|havelock'],
  ['Kaikōura District Council','kaikoura.govt.nz','kaikoura'],
  ['Buller District Council','bullerdc.govt.nz','buller|westport|reefton|karamea'],
  ['Grey District Council','greydc.govt.nz','grey district|greymouth|runanga'],
  ['Westland District Council','westlanddc.govt.nz','westland|hokitika|franz josef|haast'],
  ['Hurunui District Council','hurunui.govt.nz','hurunui|amberley|hanmer springs|cheviot'],
  ['Waimakariri District Council','waimakariri.govt.nz','waimakariri|rangiora|kaiapoi|oxford|woodend|pegasus'],
  ['Christchurch City Council','ccc.govt.nz','christchurch|banks peninsula|akaroa|lyttelton','https://ccc.govt.nz/services/rates-and-valuations/rates-and-valuation-search'],
  ['Selwyn District Council','selwyn.govt.nz','selwyn|rolleston|lincoln|darfield|leeston|prebbleton'],
  ['Ashburton District Council','ashburtondc.govt.nz','ashburton|methven|rakaia'],
  ['Timaru District Council','timaru.govt.nz','timaru|temuka|geraldine|pleasant point'],
  ['Mackenzie District Council','mackenzie.govt.nz','mackenzie|twizel|fairlie|tekapo'],
  ['Waimate District Council','waimatedc.govt.nz','waimate'],
  ['Chatham Islands Council','cic.govt.nz','chatham'],
  ['Waitaki District Council','waitaki.govt.nz','waitaki|oamaru|kurow|palmerston'],
  ['Central Otago District Council','codc.govt.nz','central otago|alexandra|cromwell|clyde|roxburgh|ranfurly'],
  ['Queenstown Lakes District Council','qldc.govt.nz','queenstown|wanaka|arrowtown|frankton|hawea'],
  ['Dunedin City Council','dunedin.govt.nz','dunedin|mosgiel|port chalmers','https://www.dunedin.govt.nz/do-it-online/search/rates'],
  ['Clutha District Council','cluthadc.govt.nz','clutha|balclutha|milton|kaitangata|owaka'],
  ['Southland District Council','southlanddc.govt.nz','southland district|winton|te anau|riverton|otautau|lumsden'],
  ['Gore District Council','goredc.govt.nz','gore|mataura'],
  ['Invercargill City Council','icc.govt.nz','invercargill|bluff']];
// Lower case without macrons, so "Whangārei" and "Whangarei" match.
function plain(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[’']/g,'')}
// Tries each piece of text in turn (e.g. the council name from the address search, then the suburb / city typed in),
// and within it the last comma-separated part first, since that's usually the city.
function councilOf(texts){
  for(var t=0;t<texts.length;t++){
    var bits=plain(texts[t]).split(',').map(function(b){return b.trim()}).filter(Boolean).reverse();
    for(var b=0;b<bits.length;b++)for(var i=0;i<COUNCILS.length;i++){
      if(COUNCILS[i][2].split('|').some(function(k){return new RegExp('(^|[^a-z])'+k+'([^a-z]|$)').test(bits[b])}))return COUNCILS[i];
    }
  }
  return null;
}
// A link to the council's rates search, or a web search for it when the council isn't known.
function ratesLink(addr,sub,county){
  var c=councilOf([county,sub]);
  if(!c)return sub?{url:'https://duckduckgo.com/?q='+encodeURIComponent(sub+' council rates search'),label:'Search for the council’s rates lookup'}:null;
  if(c[3])return {url:c[3].replace('{q}',encodeURIComponent(addr||'')),label:'Look up rates on '+c[0]+'’s site',direct:/\{q\}/.test(c[3])};
  return {url:'https://duckduckgo.com/?q='+encodeURIComponent('rates search site:'+c[1]),label:'Find '+c[0]+'’s rates search'};
}
