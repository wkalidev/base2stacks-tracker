'use client';
import { useState, useCallback } from 'react';

// ─── MULTI-GATEWAY FALLBACK ────────────────────────────────────
const GATEWAYS = [
  'https://w3s.link/ipfs/',              // web3.storage — le plus rapide
  'https://ipfs.io/ipfs/',               // IPFS Foundation
  'https://dweb.link/ipfs/',             // Protocol Labs
  'https://gateway.pinata.cloud/ipfs/', // Pinata — dernier recours
];

function getGatewayUrl(cid: string, gatewayIndex = 0): string {
  const gateway = GATEWAYS[gatewayIndex % GATEWAYS.length];
  return `${gateway}${cid}`;
}

function extractCid(url: string): string {
  return url.split('/ipfs/').pop() ?? url;
}

// ─── 167 REAL BADGES ON PINATA IPFS ──────────────────────────
const IPFS_BADGES = [
  { tokenId:1,   name:'B2S Badge #1',   trait:'Crypto Breaker',  rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreidcb3rtrzzosvv44fekxwkyeubdjgxr3lwz6ou6euw5khy2xxrx7u' },
  { tokenId:2,   name:'B2S Badge #2',   trait:'Red Team',        rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreicqoasepmmpeeee7e7d5buxjwb24ej4rjnfgfd3eh35wsvy5ck6n4' },
  { tokenId:3,   name:'B2S Badge #3',   trait:'CTF Champion',    rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreif7zex7vvgdnmqshydn2vscv6rp5zhodoj63uqvo7v3x2anieoxs4' },
  { tokenId:4,   name:'B2S Badge #4',   trait:'Zero-Day Hunter', rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreig3c7fk6ikzmlotwczxvb4ibvvfnw35664tgps37tzc5vlg7v4jrm' },
  { tokenId:5,   name:'B2S Badge #5',   trait:'Crypto Breaker',  rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreicnulhxix3h74oqppynycvrvrlptwh4yiswh6q44mbipqrpap4zsa' },
  { tokenId:6,   name:'B2S Badge #6',   trait:'Red Team',        rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreie5w7iy5jbesf77bm3nkjpo5v72qd4ov6b4caygyubjbxtodjt45a' },
  { tokenId:7,   name:'B2S Badge #7',   trait:'CTF Champion',    rarity:'epic'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiglcty7wcodzoywig36sz7fz2yreerxbfjovm2hotss6huzjgbd4y' },
  { tokenId:8,   name:'B2S Badge #8',   trait:'Zero-Day Hunter', rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreielavblm4mstjfhgq4etaxwbjgvzz7dw4k7ccoe574fgryxmnhlqi' },
  { tokenId:9,   name:'B2S Badge #9',   trait:'Crypto Breaker',  rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreig4qz2djntqsedxuqkwsspdoev7jqpll77obahyqdmon6qncvkoda' },
  { tokenId:10,  name:'B2S Badge #10',  trait:'Red Team',        rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreifawo5bqzolxipljmu74n2w3ggodugzeoozz4pokkcw6zlapn7x4m' },
  { tokenId:11,  name:'B2S Badge #11',  trait:'CTF Champion',    rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiekkbuhz236ob45nwvfn4lskdohshxeiwpegcelxvvtq4czierdru' },
  { tokenId:12,  name:'B2S Badge #12',  trait:'Zero-Day Hunter', rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreibdy2cqw27ee6a2wocu7djargjhy224mn3kvktobcvhju6w4jvlna' },
  { tokenId:13,  name:'B2S Badge #13',  trait:'Crypto Breaker',  rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreid4jromul6tkh6vptrdtv45qtsjl2ch6khpdfr6724japlqjbllha' },
  { tokenId:14,  name:'B2S Badge #14',  trait:'Red Team',        rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreie7csb7ocepxgw4f7d37fovht4oombzh4tgsv2num2thqjfcm7djm' },
  { tokenId:15,  name:'B2S Badge #15',  trait:'CTF Champion',    rarity:'epic'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreickben2vkbtoibf2okjfbvjmv6rmsjbzckcuxol3cwavtemkug7nm' },
  { tokenId:16,  name:'B2S Badge #16',  trait:'Zero-Day Hunter', rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreicgzxwecfqalrbgxcy477acz7pcqude6krm5lx5xslblito7cvgli' },
  { tokenId:17,  name:'B2S Badge #17',  trait:'Crypto Breaker',  rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreicpewodasei5oysclxa4zctufdkjdphxhaf27nyq5h5jnajdrf6fe' },
  { tokenId:18,  name:'B2S Badge #18',  trait:'Red Team',        rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiewsyvlttgythjwb2ptdhccgk5ekxeyzsrqougtwwklhmges4aw4i' },
  { tokenId:19,  name:'B2S Badge #19',  trait:'CTF Champion',    rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreihil72smxonift5sc527jlgwekp463ecbnl54w7xtuaboobfv7wdy' },
  { tokenId:20,  name:'B2S Badge #20',  trait:'Zero-Day Hunter', rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiea5t5cje2azx6kwhsekblybeund34f3fmisnhcsnb2jkxt73524m' },
  { tokenId:21,  name:'B2S Badge #21',  trait:'Crypto Breaker',  rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreifpprouwxww4cavbwd7es4ihtwu43j6mqh2dxqnth6g6gvi4niaxe' },
  { tokenId:22,  name:'B2S Badge #22',  trait:'Red Team',        rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreidf2dhd26rlarljpfk55ggnytynkv5b62cay7626rxq2vw3wkgqny' },
  { tokenId:23,  name:'B2S Badge #23',  trait:'Bug Bounty',      rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreicmkluhvslqv6oovjpk7yjoj3sqhaxj5bzibkh67j2hkkre5dhiue' },
  { tokenId:24,  name:'B2S Badge #24',  trait:'Pen Tester',      rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiaafbujdwtodjw3u6gjrabqfvaeryx3gcix3lr4qz33uukoxv2uwu' },
  { tokenId:25,  name:'B2S Badge #25',  trait:'Rootkit Dev',     rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreig6t4fvxax2xf625oqopzgr4su2covx2uc6qo4wywyixzmjjw4cqa' },
  { tokenId:26,  name:'B2S Badge #26',  trait:'OSINT Master',    rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreielbfv3itvxdi2nwfsie7ewe5bqqx2xuacdoh3iycepnip5m5zxdu' },
  { tokenId:27,  name:'B2S Badge #27',  trait:'Bug Bounty',      rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreifzjojdcbr4bffqdhq3i24kyzvpl2v4osb66x4lipobzezx5it7ba' },
  { tokenId:28,  name:'B2S Badge #28',  trait:'Pen Tester',      rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreicv2q5jyfxvnlgzclf3gi7bmtz5cbg3gmawebanqio5bv3b5mcfsi' },
  { tokenId:29,  name:'B2S Badge #29',  trait:'Rootkit Dev',     rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreibdoqyhexmisd26k7aelfjv2n5vec2jwf3baoiyzk63qwiozutyem' },
  { tokenId:30,  name:'B2S Badge #30',  trait:'OSINT Master',    rarity:'epic'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreih2ni2lzme7yqydjgkkcyly3ukdvxz4sg6nf6j5awwqsbc37eq6ju' },
  { tokenId:31,  name:'B2S Badge #31',  trait:'Bug Bounty',      rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreigkkiwwqspobom5qfq2nz4srcakip3y2x5pfstjui43utw4q5y4na' },
  { tokenId:32,  name:'B2S Badge #32',  trait:'Pen Tester',      rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreida7mo5bhsnparxpgpaovzzxcxw3r7ppt3gb6favylqsslqeptmbm' },
  { tokenId:33,  name:'B2S Badge #33',  trait:'Rootkit Dev',     rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreig2jaradv46rf3u5dgu5fhekxlzmaxzdfwnomzacmx6grns2h45m4' },
  { tokenId:34,  name:'B2S Badge #34',  trait:'OSINT Master',    rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreidiqx2urasjbqrptgbdsuypvumcgzpkojydw3rcbrdeeqqgceacq4' },
  { tokenId:35,  name:'B2S Badge #35',  trait:'Bug Bounty',      rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreift26hl7qkp4oewaux7zn5zomg3jp4gjixkjeoo5rlm4yztq73dvu' },
  { tokenId:36,  name:'B2S Badge #36',  trait:'Pen Tester',      rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreigpdyqej4d6rdmzhk3pe4xspf2nznfczcikor3kbjiq6gvqnxrmxu' },
  { tokenId:37,  name:'B2S Badge #37',  trait:'Rootkit Dev',     rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreihcirfc6tyql3gpm5xn5tppgeykrybsy3c7b6d2ycajee5uu54sju' },
  { tokenId:38,  name:'B2S Badge #38',  trait:'OSINT Master',    rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreihsywezp7e2t6q6b34oi75vxnwpeuv6rx2pggtxtlgpvrcuvpguhu' },
  { tokenId:39,  name:'B2S Badge #39',  trait:'Bug Bounty',      rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreielbrddgwobe6vyf4ezedxtd2ij7fdy6eg6ybntddnciygrlzakty' },
  { tokenId:40,  name:'B2S Badge #40',  trait:'Pen Tester',      rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreia5qoopgg7gysrhvawcz2bmbvnokt2ufnkhujqofhuvztphy7k3zm' },
  { tokenId:41,  name:'B2S Badge #41',  trait:'Rootkit Dev',     rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreifyuxge33ycs4sewp6idw3lbaunbteabxaxga65co3nyswxqugznm' },
  { tokenId:42,  name:'B2S Badge #42',  trait:'OSINT Master',    rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreihip2exg3jftd2eacprdrik42bu3s75cy7i6ziw56h2yzpdfdxcg4' },
  { tokenId:43,  name:'B2S Badge #43',  trait:'Bug Bounty',      rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreib6mdbf2zzozjlpyqfsz4rgp7zlxelj736felo522hnri5rhxmp4a' },
  { tokenId:44,  name:'B2S Badge #44',  trait:'Pen Tester',      rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreidakhwb53s4xawmvb436ple5xbwr7tfamr7bqpxcezv3hwksfejqa' },
  { tokenId:45,  name:'B2S Badge #45',  trait:'Zero-Day Hunter', rarity:'epic'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreida7slpqiujd23ykma3hnhkima3fgwjakityjr5huel74spdfqbwq' },
  { tokenId:46,  name:'B2S Badge #46',  trait:'Crypto Breaker',  rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiegpu4njrqkizfr2ar3bn5rytw6pp3avxm7y6vb6au3hmsju5xr54' },
  { tokenId:47,  name:'B2S Badge #47',  trait:'Red Team',        rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreia3kqaoov5dwq2q77cdlw7tslgvklgilivujkryuymx3ghbtxj3ci' },
  { tokenId:48,  name:'B2S Badge #48',  trait:'CTF Champion',    rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreigcotybj2dx7hb4gvamfmmro6oebds4kylkohmt7q2a7tkncqlhei' },
  { tokenId:49,  name:'B2S Badge #49',  trait:'Zero-Day Hunter', rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreicwo36phgreu4snvayvnundjximrrpsviwmoq4t7vvudqqwjdaxwy' },
  { tokenId:50,  name:'B2S Badge #50',  trait:'Crypto Breaker',  rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiceldv55jbg7e4uf6rky57kbza36gychlfhmms7y6jaxfcjkxdtzi' },
  { tokenId:51,  name:'B2S Badge #51',  trait:'Red Team',        rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreieukcr2zrlkll7fdfqsmaixgxoyr7sulmmstjmvsn2uqaqe3otfbu' },
  { tokenId:52,  name:'B2S Badge #52',  trait:'CTF Champion',    rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreibjh2duowvibchwkx6keojbsie5lrafxlxfubxt2ormxtfqsmzroq' },
  { tokenId:53,  name:'B2S Badge #53',  trait:'Zero-Day Hunter', rarity:'epic'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreig352zaqwmcksypgunl6tyocwpy22nadzk2w5mulc7lyfqcuxzzeu' },
  { tokenId:54,  name:'B2S Badge #54',  trait:'Crypto Breaker',  rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiaxlnxflt2spta6aoabi5onos3jlrubmmvjb4zrni4ewgojqi7anq' },
  { tokenId:55,  name:'B2S Badge #55',  trait:'Red Team',        rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreickhiklnlgcseqxguqz4l4v25syuyvjgxsorznatenjxvuwoo2axa' },
  { tokenId:56,  name:'B2S Badge #56',  trait:'CTF Champion',    rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreicr5xzzq6qiypbbclp2d5zn43pks2do7462jgub3yoelltj4araye' },
  { tokenId:57,  name:'B2S Badge #57',  trait:'Zero-Day Hunter', rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreifocefptyaqa2til367uptzfqxthur5m6bgp4eqrhkxdc5m7f7tee' },
  { tokenId:58,  name:'B2S Badge #58',  trait:'Crypto Breaker',  rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreial2p4iv5kinomoeubr5zew3nykzpqwdxqvjikfcxquilbt2hfse4' },
  { tokenId:59,  name:'B2S Badge #59',  trait:'Red Team',        rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiasadcwrmjpof5mnqpzmkrqjn7x3hxq37wo72dqkvyp52kyrawesi' },
  { tokenId:60,  name:'B2S Badge #60',  trait:'CTF Champion',    rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreibjxz3kksirivozhjw355qmqnsxq2vjy6rq4yp3hcqqcjw3injulu' },
  { tokenId:61,  name:'B2S Badge #61',  trait:'Zero-Day Hunter', rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreidjoo5bg6glypdqy5usrgnsnkvgxs22btbimi7rqdzxuknqzpc2ee' },
  { tokenId:62,  name:'B2S Badge #62',  trait:'Crypto Breaker',  rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreibz4g3mlpra5gsrradhh7szy7zbytokbs3ggut5lewzkthbqkpjsu' },
  { tokenId:63,  name:'B2S Badge #63',  trait:'Red Team',        rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreihg4duzeckarbjrgpcaepmgauvrjkptmxbj6a3sqlys4zy2bczuli' },
  { tokenId:64,  name:'B2S Badge #64',  trait:'CTF Champion',    rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreihf7ousztu2to7hpbm32my2tipoqzdvgefuepiwpjrkpugdexbsja' },
  { tokenId:65,  name:'B2S Badge #65',  trait:'Zero-Day Hunter', rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreig5mkdf5iczrywtk7jthrc6uueit5ykj2hao2knq72equlqq6ezk4' },
  { tokenId:66,  name:'B2S Badge #66',  trait:'Crypto Breaker',  rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreie26xsjxcy6sgruzp7kh4eua7hw4eq56hl5e27h7kgnufdzf4dnx4' },
  { tokenId:67,  name:'B2S Badge #67',  trait:'OSINT Master',    rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiblhbi2ozwe2nzdkzx6m5zrsxbve2dtyp52eve2we6r3bnihmlvze' },
  { tokenId:68,  name:'B2S Badge #68',  trait:'Bug Bounty',      rarity:'epic'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreievhk5dredlbqjhfaq342qi42m7akhnot274t4itt6favl3ahdoma' },
  { tokenId:69,  name:'B2S Badge #69',  trait:'Pen Tester',      rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreihihfo6mf2muq45p6y2rwm24rbuvtwld2co5er4hv6wlr4xz2qbtm' },
  { tokenId:70,  name:'B2S Badge #70',  trait:'Rootkit Dev',     rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiffyo74sxtwm56deccyvtdbqokvhjsyc26nge5qkoidsi22an5lpi' },
  { tokenId:71,  name:'B2S Badge #71',  trait:'OSINT Master',    rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreia376kq3cklnqylns4fzairasbaqdwqlxqlyab4wp7d23ajcaoy2u' },
  { tokenId:72,  name:'B2S Badge #72',  trait:'Bug Bounty',      rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreid4h76xvqckkg3foxsoxhk3inesulftbw7bnpjles65y5bicl2fum' },
  { tokenId:73,  name:'B2S Badge #73',  trait:'Pen Tester',      rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreigjhbugk5k5l5ipt2jnxj33cnhj2n5knragllxcfzdsbl3oqdt2vu' },
  { tokenId:74,  name:'B2S Badge #74',  trait:'Rootkit Dev',     rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreic5dm4fbin6vvbppv6v5e7eyun4635g4ju6vvmly5l2vsv3nqrxni' },
  { tokenId:75,  name:'B2S Badge #75',  trait:'OSINT Master',    rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreicvjamn52xzmq5bhmv3vbbvpxvvdobxrnjmzdh3b5noronwelp6fm' },
  { tokenId:76,  name:'B2S Badge #76',  trait:'Bug Bounty',      rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreigaf2lsv2xlvnhweauo3rhgli55gcnk66bakhcoevswapgmnv2lia' },
  { tokenId:77,  name:'B2S Badge #77',  trait:'Pen Tester',      rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreie7tla64wx6myhk5layhfexefptqxrsygpvvwgvq35sfctcsdmozq' },
  { tokenId:78,  name:'B2S Badge #78',  trait:'Rootkit Dev',     rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreifea5tyonrhwq6shrjzt7seczzhzygsqlezfm4o66k6bhffsmruyy' },
  { tokenId:79,  name:'B2S Badge #79',  trait:'OSINT Master',    rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiekslxqwol7iqf6sr6pwkfjf7x7pqfwitu5mfunwuhxnpjtlfjdhu' },
  { tokenId:80,  name:'B2S Badge #80',  trait:'Bug Bounty',      rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreigz6thpfhsgahfrvulm4eznf3gttjgbbmj3zsalcq6oqwz73oq5qu' },
  { tokenId:81,  name:'B2S Badge #81',  trait:'Pen Tester',      rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreihrkktzdcaeuadvizhkcy2aoz6ylcyqupmeim4munfnljx23ksa6q' },
  { tokenId:82,  name:'B2S Badge #82',  trait:'Rootkit Dev',     rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreigqv4x7uvtclo2fqqy3axlo6bxl3cnmyqcgfqxgevsmvp5duwfrn4' },
  { tokenId:83,  name:'B2S Badge #83',  trait:'OSINT Master',    rarity:'epic'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreieqasmyqgkicupfeyzgzizz4aahb7mg2wsljaelvecy2b5nctby2m' },
  { tokenId:84,  name:'B2S Badge #84',  trait:'Bug Bounty',      rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreic3zcqqnmxigwz5rx7d4abphb7qtciibzx34ozlwsyr3jil7kqxem' },
  { tokenId:85,  name:'B2S Badge #85',  trait:'Pen Tester',      rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiaxwyojs6hq5pxua7gsgk7x4sxdonfjiium76lqe7fajjfruissoe' },
  { tokenId:86,  name:'B2S Badge #86',  trait:'Rootkit Dev',     rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreifee25465doebzv5c3jdfjscuf7xsrv3yy6qldv3khntie7wqkeru' },
  { tokenId:87,  name:'B2S Badge #87',  trait:'OSINT Master',    rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreid3m4qei2rmt54xrfikrhdawexr4epavp7hglm3ve2fagnuy4luxu' },
  { tokenId:88,  name:'B2S Badge #88',  trait:'Bug Bounty',      rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreibyvcva2lbzddqtrdk2bj2vda7upjamlrsczs3ukoqfa3aqowkz3a' },
  { tokenId:89,  name:'B2S Badge #89',  trait:'Pen Tester',      rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreieofrp7sik4rhs7lg46kjascmormzcvldan6myrjp5vce4yahen4e' },
  { tokenId:90,  name:'B2S Badge #90',  trait:'Zero-Day Hunter', rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreihy6vhocxp6fj2bsdj5fkwf2jl7vz7i2665lbhdrvirsxczs62scq' },
  { tokenId:91,  name:'B2S Badge #91',  trait:'Crypto Breaker',  rarity:'epic'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiczw44u7uqkscdff2goti4aw2zttlcb5isz3yrssy2wcmckxjby3a' },
  { tokenId:92,  name:'B2S Badge #92',  trait:'Red Team',        rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiebdy6lqvddhi2sm7vxngrabgg73zewejsbi3ulv5dzr2wxqzjele' },
  { tokenId:93,  name:'B2S Badge #93',  trait:'CTF Champion',    rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreialzwn75kbv3tb42bcugactycm64toygzehuuqbgxiyayynglzdvm' },
  { tokenId:94,  name:'B2S Badge #94',  trait:'Zero-Day Hunter', rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiakuiu4dcfgty2krkhkjykk7zgvjrrlvzmejg4m7mx5hej7c6bekq' },
  { tokenId:95,  name:'B2S Badge #95',  trait:'Crypto Breaker',  rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiet7ehdmpzbvpu5yyfztogveck5x3ewhw57jxj6za2yzdlzrruqwy' },
  { tokenId:96,  name:'B2S Badge #96',  trait:'Red Team',        rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreihds6qzlxxv7wjnynfdvt3wvzrmr54i6ik3xoa5kkrgfj75r2njc4' },
  { tokenId:97,  name:'B2S Badge #97',  trait:'CTF Champion',    rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiflcnshmariexgca4v3mlybezum4bu7i2j6w4bonli25notl2uu5y' },
  { tokenId:98,  name:'B2S Badge #98',  trait:'Zero-Day Hunter', rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreihzsxwlunzp7wzzgk6szyn7kg7hkdtbseibnm4hxmnx7ljovsoive' },
  { tokenId:99,  name:'B2S Badge #99',  trait:'Crypto Breaker',  rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreicdkxtdzv5nn2k4wvyoaav6u46qfjsktxmyh6p6hh2h47ibgunuua' },
  { tokenId:100, name:'B2S Badge #100', trait:'Red Team',        rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreifulnzmzdzqpoy2rzbt4uzpsqdvfjktfkz37qoabi45xoii4pm654' },
  { tokenId:101, name:'B2S Badge #101', trait:'CTF Champion',    rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreih7cdpf3szhs2om3xj53cps577s73ell4hrfo3qz2i6oizepico2e' },
  { tokenId:102, name:'B2S Badge #102', trait:'Zero-Day Hunter', rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiep7hs6ujm7tpjp52lwmvadjqy2pm7crtj72zobxpa4b7cy4qkify' },
  { tokenId:103, name:'B2S Badge #103', trait:'Crypto Breaker',  rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreigcv5zmmmizf52y3b6eq7nxepkzq2h5elbdhxnu3eaes27vpbn6si' },
  { tokenId:104, name:'B2S Badge #104', trait:'Red Team',        rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreibyjmcxhdpyqsokf27cgwitjefyhkcljn7jr23brug7o6pwmy255a' },
  { tokenId:105, name:'B2S Badge #105', trait:'CTF Champion',    rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreihxjzrih2vcdu4mfhsiekoo2vthq5e2eictm5pe7fyddgvmihts7q' },
  { tokenId:106, name:'B2S Badge #106', trait:'Zero-Day Hunter', rarity:'epic'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreidk4pnz5i676pqp4w4gl65xpekdr74e4jc2ukrtqacrhilsqadnvq' },
  { tokenId:107, name:'B2S Badge #107', trait:'Crypto Breaker',  rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreidtk6fu57p2xssafoqoikuy36ny4f2x2exrrjwynvr5aoviefqevi' },
  { tokenId:108, name:'B2S Badge #108', trait:'Red Team',        rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreifztqivqpnmx7khq75jljelmxojur37bo7h765blrbhzimbbbszdy' },
  { tokenId:109, name:'B2S Badge #109', trait:'CTF Champion',    rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreig2iy2smfbqtiov6vd7xyquvjd2k7jhr2j3uxxdljurqt45s2wgyi' },
  { tokenId:110, name:'B2S Badge #110', trait:'Zero-Day Hunter', rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreicmwwyzzklcj2lcpv3d7rjf4t6xw6pbhhux235umgjvbkddbr6nry' },
  { tokenId:111, name:'B2S Badge #111', trait:'Crypto Breaker',  rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreif3iax732prqcsavixt7x6kfauvp4t4aiayhe3w6e4pikezwessye' },
  { tokenId:112, name:'B2S Badge #112', trait:'OSINT Master',    rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreicrgngo5iv4kmt2fuknw5rhw4bmmrgc5s6j7cusm4g226wyovfqza' },
  { tokenId:113, name:'B2S Badge #113', trait:'Bug Bounty',      rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreig3qs7r6mziikv6hjpj25eaf44rgdqnhrh5pptiseq7nntstbmjwy' },
  { tokenId:114, name:'B2S Badge #114', trait:'Pen Tester',      rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreianssyh6jdvlbcel27qbjtyjjl224y5h3p2vcy4hl5dpv3wkbhzcq' },
  { tokenId:115, name:'B2S Badge #115', trait:'Rootkit Dev',     rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreibzb3pvbbb2yva6eeoaifhu4llzsppetdxjpsll2ct7tgumt5eoq4' },
  { tokenId:116, name:'B2S Badge #116', trait:'OSINT Master',    rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiho47uifloliuk6k2t3ipxzxsqvq2n6xftojxjn2jehdl62u7toi4' },
  { tokenId:117, name:'B2S Badge #117', trait:'Bug Bounty',      rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiaqyd7s5743tkmk5cdcrd67cqhqlz7da7blheszccyhuvi5y2sxre' },
  { tokenId:118, name:'B2S Badge #118', trait:'Pen Tester',      rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreigsnn6xdtqe2gu34zklc2dop67reqjjvgb5ot7tf3f3cy2kldcscq' },
  { tokenId:119, name:'B2S Badge #119', trait:'Rootkit Dev',     rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreigjpacyabt6j2tiquuxevyq5za5laehpjnnvibhf4gi23dhwkbsjy' },
  { tokenId:120, name:'B2S Badge #120', trait:'OSINT Master',    rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiadzn24sxlgbdy5sdlmymv6lp4waljuza7u7tz5zdr5fnn2vt3suu' },
  { tokenId:121, name:'B2S Badge #121', trait:'Bug Bounty',      rarity:'epic'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiangs4b5ul2cebez7aki22chnx5ivc5a7q4euzclp4gcaftz3lgbq' },
  { tokenId:122, name:'B2S Badge #122', trait:'Pen Tester',      rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreihbzx7qo3uo3e6j47v46ptosdiybwqojpfjhcyfusmtr6gnmdmkmu' },
  { tokenId:123, name:'B2S Badge #123', trait:'Rootkit Dev',     rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiflxouqlhz7uqdgi5qajiqu5lnsvtyf5n5wid242odyhiq5y72cdq' },
  { tokenId:124, name:'B2S Badge #124', trait:'OSINT Master',    rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreigxzmnp2yopygrmw5ukx2apiiwj4na2wv2wzbveg4dvf4ql7css2e' },
  { tokenId:125, name:'B2S Badge #125', trait:'Bug Bounty',      rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreic4jd7zalpcb5r6qkcat5ddo3hjvqipfw4efy7yxthbl3dvola7ua' },
  { tokenId:126, name:'B2S Badge #126', trait:'Pen Tester',      rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiea6g6gqhy3tcdnoykrxu3z2d2xft2omscy7at3zbhejc7xigixti' },
  { tokenId:127, name:'B2S Badge #127', trait:'Rootkit Dev',     rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreihaofbcy2oxgvquimd2bsa6evb2xtrdqpoi3w5cpjd6fd44ymko5q' },
  { tokenId:128, name:'B2S Badge #128', trait:'OSINT Master',    rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiegqignwynrtrsy46zpaf7mfdupdi24c2sg3ailawo2e27ew2aeda' },
  { tokenId:129, name:'B2S Badge #129', trait:'Bug Bounty',      rarity:'epic'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreifiicarxush2npahjhn2lh5w7vva77okjisxuxkebmlzn4ng42k6a' },
  { tokenId:130, name:'B2S Badge #130', trait:'Pen Tester',      rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreigmyiwiegxicwn2ir6cgjunzkm3sugtofpzrw2kzmyaaqjfz5npzm' },
  { tokenId:131, name:'B2S Badge #131', trait:'Rootkit Dev',     rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreibo356g6ni7ghqpowzyqabfgikilhxdgwh673npzd2z6pne2c2z3i' },
  { tokenId:132, name:'B2S Badge #132', trait:'OSINT Master',    rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiap5lmspcy4e6ihaougbbfwgudn2aaesg7oc2c23fobhsiptlerd4' },
  { tokenId:133, name:'B2S Badge #133', trait:'Bug Bounty',      rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreidyofifq3mhia3u2xw4u6lqrf3fht5p2ttaxr2id3q6ecec7mhnnu' },
  { tokenId:134, name:'B2S Badge #134', trait:'CTF Champion',    rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreic66x32xmryvkikuvphu6h5by3ilxh7b3aj6ev2o4qgnz3yiqvtee' },
  { tokenId:135, name:'B2S Badge #135', trait:'Zero-Day Hunter', rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreidhonbxikxpqhnpr3i7uuuvmczzx3m5apvstzq2e7ntxgu7ska7ri' },
  { tokenId:136, name:'B2S Badge #136', trait:'Crypto Breaker',  rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreibi4tqd5lasoyr5nu6tfuygc5uq4v3rp3xlhi7i2rxxfezxxgve5q' },
  { tokenId:137, name:'B2S Badge #137', trait:'Red Team',        rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreieikphwbxhzaphsz6yx2fd3xjjmpsycojtz73vrdn5d4pb5tt32sa' },
  { tokenId:138, name:'B2S Badge #138', trait:'CTF Champion',    rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiadex3aeanmjy5vwqacul36kfdwoylxloabrwcoza5lw4zhgasnaq' },
  { tokenId:139, name:'B2S Badge #139', trait:'Zero-Day Hunter', rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreigkyt5gafiubzuiolqf6iunmgdw7qvr63wlrzckcgblo4i4fdpcni' },
  { tokenId:140, name:'B2S Badge #140', trait:'Crypto Breaker',  rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreig6chosaspu42uhzsrecdm257hibmrerzfzvvh63ue3mr6mkunz5y' },
  { tokenId:141, name:'B2S Badge #141', trait:'Red Team',        rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiatdxroum7jlluvsu6wlcg5zg6y7axfqojxrhmfpjgwcfzmz3jmk4' },
  { tokenId:142, name:'B2S Badge #142', trait:'CTF Champion',    rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreihjf4bcbbio45bzk532va47mmuxomo2kc4dalf2nng4kivoaax7wu' },
  { tokenId:143, name:'B2S Badge #143', trait:'Zero-Day Hunter', rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreieepq447hem4znszxbrvdzyfeno57wyc2szktogkjujpicfc5ywsa' },
  { tokenId:144, name:'B2S Badge #144', trait:'Crypto Breaker',  rarity:'epic'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreid7tjo4t4xrhsheargfbp73zn3j35tk3mantztxlwov3iax6mf2u4' },
  { tokenId:145, name:'B2S Badge #145', trait:'Red Team',        rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreidlg3d5mlquwqy4i3lzav2nv63md4ppyky3y2b2fyffwfpboxppxm' },
  { tokenId:146, name:'B2S Badge #146', trait:'CTF Champion',    rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreif4k4itvf6ilooilxeysnacgl66hhrqc3anlkbq5uza4p3fovtchi' },
  { tokenId:147, name:'B2S Badge #147', trait:'Zero-Day Hunter', rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreic26c2v5akz4isvil6semxxcphe5mytq3wdy3hxuf5fwe7n4xwyfq' },
  { tokenId:148, name:'B2S Badge #148', trait:'Crypto Breaker',  rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreibpxnxnyzweh37u63lv6zvgtnejsdkxp4dtp6emrlngzfk75vl2w4' },
  { tokenId:150, name:'B2S Badge #150', trait:'CTF Champion',    rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiebkhqy7coq2q4onitrm6pffk3j7escgwmd2yoyftufmbam7gzvem' },
  { tokenId:151, name:'B2S Badge #151', trait:'Zero-Day Hunter', rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiegrpzkge6jsz2ttwh76j36l5gecctvdsjw7uqf744tvly3gostzm' },
  { tokenId:153, name:'B2S Badge #153', trait:'Red Team',        rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiffg35cpxvv2yqyc2y3l54vpkmmzmilmvkayzwditcsr7cgwbw57y' },
  { tokenId:154, name:'B2S Badge #154', trait:'CTF Champion',    rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreidhypp5f2c4sfoymvrjmrkvbducgoeurdlto5rdd5ptilnd6ze3ma' },
  { tokenId:155, name:'B2S Badge #155', trait:'Zero-Day Hunter', rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreib6gz5sh5geqvj3ipovcacgsfxekkc3z6l44wuylqfmp4d5fzrbey' },
  { tokenId:156, name:'B2S Badge #156', trait:'Crypto Breaker',  rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreib4ogo2zvfanzog3ej32h4ja6hihmypk7g5h72bsqhtrzzpvie4xa' },
  { tokenId:157, name:'B2S Badge #157', trait:'OSINT Master',    rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreibmsxo5keewxu6kst7ot3hfqdsncniribl5r5srqoasuqstogwkby' },
  { tokenId:158, name:'B2S Badge #158', trait:'Bug Bounty',      rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreicmxsc27k2l5ps2s4sqqw3kbdzf5kkukigld5ykkigadggpzo35x4' },
  { tokenId:159, name:'B2S Badge #159', trait:'Pen Tester',      rarity:'epic'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreifrd7ylxlerdomlb7g2f3hu2k6orleu5ggzzbabnmmooa3xpoq3yi' },
  { tokenId:160, name:'B2S Badge #160', trait:'Rootkit Dev',     rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreiefa6licv7hgytvqbru6lajwo3dssvu5j4sl5rdphiffv53eyyrrq' },
  { tokenId:161, name:'B2S Badge #161', trait:'OSINT Master',    rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreid7q3lha2al3pfralahiwglysyptvxnrp2t3vffs4tgu6q4t2g2r4' },
  { tokenId:162, name:'B2S Badge #162', trait:'Bug Bounty',      rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreif6qeqym6wjk7mh5wqicpncbfmenpsu3v5c66txkaao34ydoqjkni' },
  { tokenId:163, name:'B2S Badge #163', trait:'Pen Tester',      rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreihrlfr4nzeclsvvrm36dww72oz2kucgd37nkxpgewokzlvrj3r6gq' },
  { tokenId:164, name:'B2S Badge #164', trait:'Rootkit Dev',     rarity:'uncommon'  as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreidyxtjylx7x5khxqz4p5jctvff45pn344hihnulhekt4qvlu5srue' },
  { tokenId:165, name:'B2S Badge #165', trait:'OSINT Master',    rarity:'rare'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreihgatjo3enoncaneps24spqexebpkdx7abuhojvgbfkuwwqxc75ua' },
  { tokenId:167, name:'B2S Badge #167', trait:'Pen Tester',      rarity:'epic'      as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreicczp74ezgkwpfi5r7bvhpyflzlj4rjme2pofq7go2ot43fdukmum' },
  { tokenId:168, name:'B2S Badge #168', trait:'Rootkit Dev',     rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreibyehz2koopyun7v2muzxy4ljegfcfygf2sgiwytk7hr374zbo5c4' },
  { tokenId:169, name:'B2S Badge #169', trait:'OSINT Master',    rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreifjyv4bltlkv22fvri4aqjt4t7p2qbzkekp5tmyga45ebl5jpuxme' },
  { tokenId:170, name:'B2S Badge #170', trait:'Bug Bounty',      rarity:'common'    as const, imageUrl:'https://gateway.pinata.cloud/ipfs/bafkreieloem7viiiwhpeebzbo3lahwh4wbo5fgpdigkqhioghprg4zjrmu' },
];

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

const RARITY_COLOR: Record<Rarity, string> = {
  common:    'from-gray-500 to-gray-600',
  uncommon:  'from-green-500 to-emerald-600',
  rare:      'from-blue-500 to-cyan-600',
  epic:      'from-purple-500 to-pink-600',
  legendary: 'from-orange-400 to-yellow-500',
};
const RARITY_BORDER: Record<Rarity, string> = {
  common:    'border-gray-600/40',
  uncommon:  'border-green-500/40',
  rare:      'border-blue-500/40',
  epic:      'border-purple-500/40',
  legendary: 'border-yellow-400/70',
};
const RARITY_GLOW: Record<Rarity, string> = {
  common:    '',
  uncommon:  '',
  rare:      'shadow-blue-500/20 shadow-lg',
  epic:      'shadow-purple-500/30 shadow-xl',
  legendary: 'shadow-yellow-400/40 shadow-2xl',
};
const RARITY_ICON: Record<Rarity, string> = {
  common: '◆', uncommon: '◆◆', rare: '◆◆◆', epic: '★', legendary: '🌟',
};

// ─── NFT IMAGE avec fallback multi-gateway + retry delay ────────
function NFTImage({ badge, className = '' }: { badge: typeof IPFS_BADGES[0], className?: string }) {
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const [loaded, setLoaded]             = useState(false);
  const [failed, setFailed]             = useState(false);
  const [retrying, setRetrying]         = useState(false);
  const retryTimeout                    = useState<ReturnType<typeof setTimeout> | null>(null);

  const cid = extractCid(badge.imageUrl);
  const src = getGatewayUrl(cid, gatewayIndex);

  const handleError = useCallback(() => {
    const nextIndex = gatewayIndex + 1;
    if (nextIndex < GATEWAYS.length) {
      // Délai croissant entre chaque tentative pour éviter le rate-limit
      const delay = nextIndex * 800;
      setRetrying(true);
      const t = setTimeout(() => {
        setGatewayIndex(nextIndex);
        setRetrying(false);
      }, delay);
      retryTimeout[1](t);
    } else {
      setFailed(true);
    }
  }, [gatewayIndex]);

  // Cleanup timeout on unmount
  useState(() => {
    return () => {
      if (retryTimeout[0]) clearTimeout(retryTimeout[0]);
    };
  });

  if (failed) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-gray-800/80 ${className}`}>
        <div className="text-xl mb-1 opacity-30">⬡</div>
        <div className="text-gray-600 text-[9px]">#{badge.tokenId}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Skeleton shimmer — toujours gris neutre, jamais coloré */}
      {(!loaded || retrying) && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" style={{ background: '#1f2937' }} />
      )}
      {!retrying && (
        <img
          src={src}
          alt={badge.name}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={handleError}
        />
      )}
    </div>
  );
}

export default function NFTMarketplace() {
  const [filter, setFilter]     = useState<Rarity | 'all'>('all');
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<typeof IPFS_BADGES[0] | null>(null);
  const [page, setPage]         = useState(0);
  const PER_PAGE = 24;

  const filtered = IPFS_BADGES.filter(b => {
    if (filter !== 'all' && b.rarity !== filter) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) &&
        !b.trait.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pages     = Math.ceil(filtered.length / PER_PAGE);
  const displayed = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const stats = {
    total:     IPFS_BADGES.length,
    legendary: IPFS_BADGES.filter(b => b.rarity === 'legendary').length,
    epic:      IPFS_BADGES.filter(b => b.rarity === 'epic').length,
    rare:      IPFS_BADGES.filter(b => b.rarity === 'rare').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">⬡ NFT Badge Collection</h2>
          <p className="text-gray-400 text-sm mt-1">
            {stats.total} badges on IPFS · {stats.legendary} 🌟 Legendary · {stats.epic} ★ Epic · {stats.rare} ◆◆◆ Rare
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total on IPFS', value: stats.total,     color: 'text-white' },
          { label: '🌟 Legendary',  value: stats.legendary,  color: 'text-yellow-400' },
          { label: '★ Epic',        value: stats.epic,       color: 'text-purple-400' },
          { label: '◆◆◆ Rare',     value: stats.rare,       color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-gray-400 text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search badge or trait..."
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 flex-1 min-w-40"
        />
        {(['all','legendary','epic','rare','uncommon','common'] as const).map(r => (
          <button
            key={r}
            onClick={() => { setFilter(r); setPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              filter === r
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            {r === 'all' ? `All (${IPFS_BADGES.length})` : `${RARITY_ICON[r]} ${r}`}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {displayed.map(badge => (
          <div
            key={badge.tokenId}
            onClick={() => setSelected(badge)}
            className={`relative bg-gray-800/60 border ${RARITY_BORDER[badge.rarity]} ${RARITY_GLOW[badge.rarity]}
              rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-all duration-200 group`}
          >
            <div className="aspect-square w-full overflow-hidden bg-gray-900 isolate">
              <NFTImage
                badge={badge}
                className="group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className={`absolute top-1.5 right-1.5 bg-gradient-to-r ${RARITY_COLOR[badge.rarity]} 
              text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full`}>
              {RARITY_ICON[badge.rarity]}
            </div>
            <div className="p-2">
              <div className="text-white text-[11px] font-semibold">#{badge.tokenId}</div>
              <div className="text-gray-400 text-[10px] truncate">{badge.trait}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30">
            ← Prev
          </button>
          <span className="text-gray-400 text-sm">{page+1} / {pages} &nbsp;·&nbsp; {filtered.length} badges</span>
          <button onClick={() => setPage(p => Math.min(pages-1, p+1))} disabled={page===pages-1}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-30">
            Next →
          </button>
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}>
          <div className={`bg-gray-900 border ${RARITY_BORDER[selected.rarity]} ${RARITY_GLOW[selected.rarity]}
            rounded-2xl max-w-sm w-full overflow-hidden`} onClick={e => e.stopPropagation()}>
            <div className="aspect-square w-full bg-gray-800">
              <NFTImage badge={selected} />
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">{selected.name}</h3>
                  <p className="text-gray-400 text-sm">{selected.trait}</p>
                </div>
                <span className={`bg-gradient-to-r ${RARITY_COLOR[selected.rarity]} text-white text-xs font-bold px-2 py-1 rounded-full`}>
                  {RARITY_ICON[selected.rarity]} {selected.rarity}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-gray-500 text-xs">Token ID</div>
                  <div className="text-white font-mono">#{selected.tokenId}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-gray-500 text-xs">Rarity</div>
                  <div className="text-white capitalize">{selected.rarity}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={selected.imageUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 text-center bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                  View on IPFS ↗
                </a>
                <button onClick={() => setSelected(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2 rounded-lg transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}