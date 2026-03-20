'use client';
import { useState, useEffect, useCallback } from 'react';

// ─── MULTI-GATEWAY FALLBACK ────────────────────────────────────
const GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
];

function getGatewayUrl(cid: string, gatewayIndex = 0): string {
  const gateway = GATEWAYS[gatewayIndex % GATEWAYS.length];
  return `${gateway}${cid}`;
}

function extractCid(url: string): string {
  return url.split('/ipfs/').pop() ?? url;
}

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
  // GLITCH ART SERIE #201-500
  { tokenId:201, name:'B2S Badge #201', trait:'Shellcoder', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVYPHKStGc13q9nrjGMFZ6BCYQ9Me7rRg93hBbFPjCbNA' },
  { tokenId:202, name:'B2S Badge #202', trait:'Network Sniffer', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPuSPKUGniwisvDwepQkY4p9TkKYeZWEttAbJqSnjKxFG' },
  { tokenId:203, name:'B2S Badge #203', trait:'Steganographer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qme7TMV16qbsfuS6K8MxD6pLHaM78cApXiGZ43tqvR4H33' },
  { tokenId:204, name:'B2S Badge #204', trait:'DeFi Hacker', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmd8FrXLc8mk9NxgUfMWWNuzTtYr3z2wJJ5zX5RjS9DPXN' },
  { tokenId:205, name:'B2S Badge #205', trait:'Flash Loan Wizard', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmSvF7z5DjjNyqw7sxbTpYeGesKkKp2teX7hMCwTyY6wEj' },
  { tokenId:206, name:'B2S Badge #206', trait:'MEV Hunter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXfNyQmjN3NW8aUqBZKCuLXymuuoC5TK1a2ECzeT9gzUY' },
  { tokenId:207, name:'B2S Badge #207', trait:'Smart Contract Auditor', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmP4E9a6gfgtK5NZiKBAZiuEmx1VkBUf6RpLUgjSLN2FWQ' },
  { tokenId:208, name:'B2S Badge #208', trait:'Bridge Exploiter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTWpQKPu97oSJpkmNzHyHQ7seM4UWBbreLPnnxhEc3kHB' },
  { tokenId:209, name:'B2S Badge #209', trait:'Rug Detector', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUFLrLVMhd1EeArxzG72XDmNFdLhwSsfQZT54NsLYFCPq' },
  { tokenId:210, name:'B2S Badge #210', trait:'Whale Watcher', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRxGP4N19FTrcsriu4tX6sH5TfmgQAAFdHtqQ546rVp8s' },
  { tokenId:211, name:'B2S Badge #211', trait:'Liquidity Sniper', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPSf4aPFW7xapeESSKNhW46vFaaddkg6pePM5D94Tgrzh' },
  { tokenId:212, name:'B2S Badge #212', trait:'On-Chain Analyst', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUX1RseeVngkznPrwG5XzBcyaZNrZvnn5xeLXeZDa8sUK' },
  { tokenId:213, name:'B2S Badge #213', trait:'Governance Voter', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmaS6PqXC1aL4s9mAoksSPEP8SZ6VEjgdEuZi73g84TGfZ' },
  { tokenId:214, name:'B2S Badge #214', trait:'Yield Optimizer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTDYuYLqiB3SqtgbwyXep1nmPR2yajjctMEeUzYuxs1Co' },
  { tokenId:215, name:'B2S Badge #215', trait:'Cross-Chain Ranger', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXYtmtvSrVR9pXRVC5PRZE5oFSF9rxQ1XMbdciLiGxd8D' },
  { tokenId:216, name:'B2S Badge #216', trait:'Blockchain Forensic', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQqewYFHuZKm5UMvNDP4tkUcwhnSSWMJJ3Md2AgDZHM78' },
  { tokenId:217, name:'B2S Badge #217', trait:'Crypto OSINT', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZ2wF5B3q8qDMzz8Z3jAaZvX8fnXCHmaUmb6GxFprW3Nw' },
  { tokenId:218, name:'B2S Badge #218', trait:'Web3 Red Team', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVHFqd2MxUCCQF7wffA2ixLyYbHcEmAvNVbUvAS6j3dbR' },
  { tokenId:219, name:'B2S Badge #219', trait:'DAO Infiltrator', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUUF7cbtvbWFtD7QfPgAeYDCkeK3bCV4Xu3munGECuSMB' },
  { tokenId:220, name:'B2S Badge #220', trait:'Token Engineer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmaeiLLKccVBDmqLQgEPzUqef4WxCxPG6brrcEx6WYHLUZ' },
  { tokenId:221, name:'B2S Badge #221', trait:'ZK Prover', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmf3hfxbv9xeqftNhm9Czz67atQkV6RqdEgbddj2EKcqss' },
  { tokenId:222, name:'B2S Badge #222', trait:'Sandwich Botter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmeJEMBcZELsUEQ8BU6cbJv3JhhMbBJq8Fd5bLqWuvKUVA' },
  { tokenId:223, name:'B2S Badge #223', trait:'Mempool Watcher', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmdzw8kDG3m3ZnFBBo1n7QkREqzzccaS8LLkzgtzYEpKVw' },
  { tokenId:224, name:'B2S Badge #224', trait:'Social Engineer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmb8wPJiFg2QPeSGebBccxnHMWomdYb2CoYRSFUziVRjid' },
  { tokenId:225, name:'B2S Badge #225', trait:'Malware Dev', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVcQwxisfKwkuYyooAoWboJRgA2yU1Rt842WwpqhBdXhW' },
  { tokenId:226, name:'B2S Badge #226', trait:'Exploit Writer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmP8oCVgKKtNmG7tyMGi9KBYdSecqntBgNAxqs4cC7nHx8' },
  { tokenId:227, name:'B2S Badge #227', trait:'Forensic Analyst', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUpLi5sR5FpsNomT3CWcnzJBN4rM1RSMacMBHqfQo1Adr' },
  { tokenId:228, name:'B2S Badge #228', trait:'Dark Web Scout', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUwbeSzU8Dz6dXfyiEex5e7h8YgEe2hHkvNmXRjBa8j5o' },
  { tokenId:229, name:'B2S Badge #229', trait:'Payload Crafter', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTevcD2WvWtEoorHVchRy3sEXhhaZuNFvNHc7CDKVGZ6r' },
  { tokenId:230, name:'B2S Badge #230', trait:'APT Operator', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmb5Meb88UJbWC9AU4xnfzqR4nz6zZhBEsRq2gHxj7nkyb' },
  { tokenId:231, name:'B2S Badge #231', trait:'Reverse Engineer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmdxyf36XuGDTMSvTeT8pxoJar8hApBsmNWJuwrtZqfrcA' },
  { tokenId:232, name:'B2S Badge #232', trait:'Fuzzer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmaQmGm96SNwmmjk5m4a3tDQvXcApbM9AjENU4GLRUmjeH' },
  { tokenId:233, name:'B2S Badge #233', trait:'Shellcoder', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmeNWhWiA6Webkw8RxdwvYmEzekch6rjcY4iFp6z2JJFqh' },
  { tokenId:234, name:'B2S Badge #234', trait:'Network Sniffer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTah6kqLZ7xPywmy65pWv6gjRP9FRcpJnAVNiZseKZxUZ' },
  { tokenId:235, name:'B2S Badge #235', trait:'Steganographer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVF4jhv9WtSxm4WW218vsnGbLfpwxwKkxyHgNv6EudQ9H' },
  { tokenId:236, name:'B2S Badge #236', trait:'DeFi Hacker', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qma5er2sV9NtrZ5JGLEuttePfuExDQ1qDUQiWZBsq4yNew' },
  { tokenId:237, name:'B2S Badge #237', trait:'Flash Loan Wizard', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTifMwMrQiQsvMcE6FrwfuGCvYWrMjYSvQysU4P6F4D1L' },
  { tokenId:238, name:'B2S Badge #238', trait:'MEV Hunter', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmNyFYR6LCzPmPQKNtoAqvsTqhMQ9mzgYgkVV9Eczqv9Te' },
  { tokenId:239, name:'B2S Badge #239', trait:'Smart Contract Auditor', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVhc1oE7XVCxntk7P2rWNg3yQ5psaqX3G8KiZG1cxxowc' },
  { tokenId:240, name:'B2S Badge #240', trait:'Bridge Exploiter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZ2gBeJ8oqMDkn3V4mWCLVbLuQjps3VKWzmyYaTXVfeHV' },
  { tokenId:241, name:'B2S Badge #241', trait:'Rug Detector', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXPXEHnbBdQh9tZT9FPFR8RxA7K5pYt9NsZ96GCxRBDq2' },
  { tokenId:242, name:'B2S Badge #242', trait:'Whale Watcher', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmYzBHxWwRDmuErbXKhuixceebrUn8kATwsh8VxktktnYi' },
  { tokenId:243, name:'B2S Badge #243', trait:'Liquidity Sniper', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbQUEAZASbUTu9DufJzvxyAsXKbdt4hYLsRSZZycXvXD9' },
  { tokenId:244, name:'B2S Badge #244', trait:'On-Chain Analyst', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmce2AqhbLvjaQwSZLj3FpEbBs5Jxvq4kKxmpqaq21HSuh' },
  { tokenId:245, name:'B2S Badge #245', trait:'Governance Voter', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmfN7BeVxKBpodsXFaw9sHXhRy9hxG4CDyqWEkqQgF4V4F' },
  { tokenId:246, name:'B2S Badge #246', trait:'Yield Optimizer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmaREd5npvAFTp6zpStaRQHKAwdYaVouHNMsrGkiMG9ryy' },
  { tokenId:247, name:'B2S Badge #247', trait:'Cross-Chain Ranger', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTGZ4uJErs6K7iJJQQQtbohvRfXMJY6XyNq2vHgAVLdFv' },
  { tokenId:248, name:'B2S Badge #248', trait:'Blockchain Forensic', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbK5iwmR3HZ5LMryogN1NgaaNAPoqdHKURbHDyJRMWTr5' },
  { tokenId:249, name:'B2S Badge #249', trait:'Crypto OSINT', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWC3Xh5gBNVuNK4Xjirn1k3m1rbwQpLQXGwXr2LLS6QH6' },
  { tokenId:250, name:'B2S Badge #250', trait:'Web3 Red Team', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmahdA9bdEQPK6PnLoQ1MDi33bST4dFkpydmYQkPSHhXPF' },
  { tokenId:251, name:'B2S Badge #251', trait:'DAO Infiltrator', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmexoJXvNAaSk346wmw3cFWXz3yRZcBHnGQUNUzmf4UN87' },
  { tokenId:252, name:'B2S Badge #252', trait:'Token Engineer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRhRrnYunr6TRsf25Scc3KH9Kkwpt1BABgnLhiPSKFnHH' },
  { tokenId:253, name:'B2S Badge #253', trait:'ZK Prover', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTRLMGmrHJRf6krynpUn7xGzYs85ZYNVrzZoHSX7sZG9G' },
  { tokenId:254, name:'B2S Badge #254', trait:'Sandwich Botter', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPKm3drRjSagQdZeMRCcLgAr6XvQ4cVyxTne9F76vMFDF' },
  { tokenId:255, name:'B2S Badge #255', trait:'Mempool Watcher', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWbxq41VUcpodqk7VK18DiFwiqaLDWVFhXptaZDcXTcY7' },
  { tokenId:256, name:'B2S Badge #256', trait:'Social Engineer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdWphccFzkzzmHHdZ3KZj261P1oiJQrbBY1q7rtJAEMPg' },
  { tokenId:257, name:'B2S Badge #257', trait:'Malware Dev', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUt45ZKkN7B4Kfr6AYMWJbVmwvnU67ZH3TaQqowPxkzx2' },
  { tokenId:258, name:'B2S Badge #258', trait:'Exploit Writer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRxdRRQhxcuoic4DAuQZypnhCQqnpZwUHvjzW6XJdw5z5' },
  { tokenId:259, name:'B2S Badge #259', trait:'Forensic Analyst', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTUz3fGJc9GgNwkJqeUSdomAWmMx1JfRTLjDns6qt6RXn' },
  { tokenId:260, name:'B2S Badge #260', trait:'Dark Web Scout', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdaoLN7CdrpSMD5GA3MKkpDR2Hkd4wwqtuMG1zZztfbBm' },
  { tokenId:261, name:'B2S Badge #261', trait:'Payload Crafter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWPJXwqgqXox6QWqNaSe8QKCyuGm81RcA1mvLfirWQEq4' },
  { tokenId:262, name:'B2S Badge #262', trait:'APT Operator', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmc8GCJWQf3LSfLG499w9P2T6UjJXc7BZDdkzm34fA5ML3' },
  { tokenId:263, name:'B2S Badge #263', trait:'Reverse Engineer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmcPR5cr4LTuidLdciJ4pxHNEJrZUoPtJm5H7GJRTT7fRS' },
  { tokenId:264, name:'B2S Badge #264', trait:'Fuzzer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmNM3L3DjJAMerbZ5vZNX21EJLjA6Pi8U8YUA4ggqbTcDf' },
  { tokenId:265, name:'B2S Badge #265', trait:'Shellcoder', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXdkM5PbBgaDGMyuw272SwG1rPFPVfJcbkEviMe1UAtLr' },
  { tokenId:266, name:'B2S Badge #266', trait:'Network Sniffer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVom4bmS2KuUXT2cM5m2bz9edfLZkDboSKCbyoCeHJNcS' },
  { tokenId:267, name:'B2S Badge #267', trait:'Steganographer', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVGuyWMy2mKqUXhahotcLVwSCakoU4WesANjot8DAVxxo' },
  { tokenId:268, name:'B2S Badge #268', trait:'DeFi Hacker', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmeU6g9uacjwKjQacHv9ejCmccafw1BxmqbmzCLRDnfoqP' },
  { tokenId:269, name:'B2S Badge #269', trait:'Flash Loan Wizard', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmfXkwmVRL5ZVQ7dv2BLuLrpDX2UJ15u5w55nqFJCyDJAC' },
  { tokenId:270, name:'B2S Badge #270', trait:'MEV Hunter', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmT5R1y2qZ3V5HcFjcXTXS1n35GwRbihiJXqNZa9xoVZGG' },
  { tokenId:271, name:'B2S Badge #271', trait:'Smart Contract Auditor', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmS3EscvPrtrZrrbmSJqVdSVWi7a4G1P1kin1VqRFkNmJB' },
  { tokenId:272, name:'B2S Badge #272', trait:'Bridge Exploiter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmeZQ5FBo46wYRtHqA3TbQmcTf4fyNRseY58kunpxgqCsT' },
  { tokenId:273, name:'B2S Badge #273', trait:'Rug Detector', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmYoWzPu8LLKLYdURQmPz2apoRKhUxcXN2pzqYiwGo9Vd9' },
  { tokenId:274, name:'B2S Badge #274', trait:'Whale Watcher', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVZXRtJbm7PtKevkprHxdJLDwwKc9w4dYQfAwZJsqcgeT' },
  { tokenId:275, name:'B2S Badge #275', trait:'Liquidity Sniper', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmcHD4q3ima5z42F4Sges24ST6qkJEA1wu9gFN85Hwe1Tq' },
  { tokenId:276, name:'B2S Badge #276', trait:'On-Chain Analyst', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUVixeiiirZZCanHs8wBgvy2kq4xoJqMGfyAx1QERJLxC' },
  { tokenId:277, name:'B2S Badge #277', trait:'Governance Voter', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmcUjTMBMywHjVjUAbKHDkZq2E7wyHCzAyCHxUGbcX2j5U' },
  { tokenId:278, name:'B2S Badge #278', trait:'Yield Optimizer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qman1cU17N9q4fkfmDUmJSdofxuDKpZFWrNfXPyCmxHbUd' },
  { tokenId:279, name:'B2S Badge #279', trait:'Cross-Chain Ranger', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPvcpYjWQpQxyuDXczMQzm5hRQTKT6dmixqfUKByvWBzr' },
  { tokenId:280, name:'B2S Badge #280', trait:'Blockchain Forensic', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZc9o3oevHFehKSKWUWEDW3q5vrjeWQ9qL8ADnRkJxCZX' },
  { tokenId:281, name:'B2S Badge #281', trait:'Crypto OSINT', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQ9K1jbdLuPr6Rm5uSEpKe3ysgGqfqVyVFrcTbooiByJt' },
  { tokenId:282, name:'B2S Badge #282', trait:'Web3 Red Team', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbXR9V9RqWBTVfuaDCKztSQPXXdTz4q6bNU8hsWEWaLnQ' },
  { tokenId:283, name:'B2S Badge #283', trait:'DAO Infiltrator', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qma3eLJWkuxKMDL75ogdmdF9ic5ZpKipxepNMETdfMcDyh' },
  { tokenId:284, name:'B2S Badge #284', trait:'Token Engineer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbWnfNh9J1ZWoducr6K3yBBpgg9EWpiFLvEWUkfd6ZaRp' },
  { tokenId:285, name:'B2S Badge #285', trait:'ZK Prover', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZUk7ZFGTYPSVZYt2n8tDQu9UQXTy3EBkDe1QeprU3xeM' },
  { tokenId:286, name:'B2S Badge #286', trait:'Sandwich Botter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmU54oLfx1nz6tom43HbC4J8dgik92P7pT3GBzdUTyQrEq' },
  { tokenId:287, name:'B2S Badge #287', trait:'Mempool Watcher', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQXeUNd5dY9Pv1FTEWAaxvaTbmoVYzVzBJEUywKb6pwqC' },
  { tokenId:288, name:'B2S Badge #288', trait:'Social Engineer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbhK5BB9UEr8xePeSVDtxeqUsTd6XtxHVHeGz5iWYAx74' },
  { tokenId:289, name:'B2S Badge #289', trait:'Malware Dev', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmcJCA3KNAZnktnexnTvo4LZK4XVtuiAPkuAxbYcKkLWm2' },
  { tokenId:290, name:'B2S Badge #290', trait:'Exploit Writer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmbk4am6eCAuVkovsSbvA4nXTz1VBoFCwkYs3CTNVXtTzk' },
  { tokenId:291, name:'B2S Badge #291', trait:'Forensic Analyst', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmNjZf6QngXYouA7JFy3hdrrKSiLajNgrUULoaTRkj4mKj' },
  { tokenId:292, name:'B2S Badge #292', trait:'Dark Web Scout', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWJymftk3p5jpoaGQnXg6XT4Kbw6stcFnGjCYphDMEQyC' },
  { tokenId:293, name:'B2S Badge #293', trait:'Payload Crafter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZxFU6gKjoaKbVnSQMWhz5MWBY1ujXyconaz8ZGkPehpC' },
  { tokenId:294, name:'B2S Badge #294', trait:'APT Operator', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWPAgZ4sfABXwx97DZY4wiP9jgLT5NaQ5Yu8TQJ3xmUGC' },
  { tokenId:295, name:'B2S Badge #295', trait:'Reverse Engineer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXPJQ9YGjhC6N2H1MMf6WbPi3jtWt3KJeLJTuc4VgDSAw' },
  { tokenId:296, name:'B2S Badge #296', trait:'Fuzzer', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmb36yjbatMwN8cR5pq6M7YAAAvcWrc5pspjyW4DWKuCax' },
  { tokenId:297, name:'B2S Badge #297', trait:'Shellcoder', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmapMYpQCxhDCiRgR7pMe8FUZH5jNP7VJW6iu5yHjD9UyV' },
  { tokenId:298, name:'B2S Badge #298', trait:'Network Sniffer', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQ1MEPvtuub5XEa3PYb9RAjADpxF1zYDoTQAGpQafhWYe' },
  { tokenId:299, name:'B2S Badge #299', trait:'Steganographer', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmfAB7DWMSKwFaDtHhxtP6Q5cSvsAjsoLwVq2XTPyV1Bfj' },
  { tokenId:300, name:'B2S Badge #300', trait:'DeFi Hacker', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdYjwccv2qvUxj3WtBTB4LiAnTKvBee16cSVE6YyYkdp4' },
  { tokenId:301, name:'B2S Badge #301', trait:'Flash Loan Wizard', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmfH5pK4u1Ahh8EV2ShwtKP8HbNsBHgzjeDsRgQUP1M1DH' },
  { tokenId:302, name:'B2S Badge #302', trait:'MEV Hunter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWxZGjCF26F5VSuk2xq8fLf5o4QU62kfcB5BDPtEa13Lg' },
  { tokenId:303, name:'B2S Badge #303', trait:'Smart Contract Auditor', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRCkcjBdJqUxZAKboM2xTKhsURYorodCRD9JFfJT31Ft9' },
  { tokenId:304, name:'B2S Badge #304', trait:'Bridge Exploiter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmYDCab6BRrZxQZ56Qm5gT3XC6Gq1U8Zy5RNFZJfW2Rqu6' },
  { tokenId:305, name:'B2S Badge #305', trait:'Rug Detector', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmc3iB3ziL45F6SAtYoH5ZjEE3PKfrWQswBVqTCsbC35Ne' },
  { tokenId:306, name:'B2S Badge #306', trait:'Whale Watcher', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWZoHqpEW7yiT6m6QMVh37X2qWLnemZ1faVuH9kRvpCg1' },
  { tokenId:307, name:'B2S Badge #307', trait:'Liquidity Sniper', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmP9FzAA7Rqg59e4JEQ8CXSK3jFxTPKouSRundBbxQR3ER' },
  { tokenId:308, name:'B2S Badge #308', trait:'On-Chain Analyst', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmesiYF7yi6U85F6nc4HSDBCCEqJuLTE59fsWvAc258jM9' },
  { tokenId:309, name:'B2S Badge #309', trait:'Governance Voter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRbRxmUDxcrWsKDktNKaPTfLJPxCwPZrdU1NQFMdf13Tb' },
  { tokenId:310, name:'B2S Badge #310', trait:'Yield Optimizer', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmfXR81wEcy5NMammkGkQVKfxKKF893iAeknSyXcMseWeH' },
  { tokenId:311, name:'B2S Badge #311', trait:'Cross-Chain Ranger', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmcmg5SKDvGLdtCaGXifnsGd1DNjZjcPRN9ePrJf3frATY' },
  { tokenId:312, name:'B2S Badge #312', trait:'Blockchain Forensic', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmSiF66U5cWko2pMEKD8YV1R3Lw9bbE75qCGYtdvhs6aAH' },
  { tokenId:313, name:'B2S Badge #313', trait:'Crypto OSINT', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZLRHqZP6j9DzjfPcbYieDGbGnqtS9JRZ1UbWqUC9PUn3' },
  { tokenId:314, name:'B2S Badge #314', trait:'Web3 Red Team', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQEueA1hineGwy3mBf4bY8GpGbW9PJhgRTr3K96cBzD65' },
  { tokenId:315, name:'B2S Badge #315', trait:'DAO Infiltrator', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmU98kZJGtLvnzCBepcHfwpZpzmXERZgWzubqU1NHg8jdi' },
  { tokenId:316, name:'B2S Badge #316', trait:'Token Engineer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmcSwygbi7dAJezCkPAFpHwbLY4RpabmRjZaKS5wdJGsvo' },
  { tokenId:317, name:'B2S Badge #317', trait:'ZK Prover', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRsDaBpWNfz5UCi9PccouBGjfp8TeejCs7MLEYNA58WoF' },
  { tokenId:318, name:'B2S Badge #318', trait:'Sandwich Botter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUH7J997tiim2tqc4NbAuQTgALUPjyMz5w1WMv2TbraFx' },
  { tokenId:319, name:'B2S Badge #319', trait:'Mempool Watcher', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQYvcrPQdV9fobwHBXgt47xCHz8t7kyrbvSUgVDjfCYuW' },
  { tokenId:320, name:'B2S Badge #320', trait:'Social Engineer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmeonUqydbBQEhFFWi8VJTe5yyFKKjWb2TwbBBL56pQmTa' },
  { tokenId:321, name:'B2S Badge #321', trait:'Malware Dev', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPo8yZu5zwicy1NzEdX5kvd62EGWMUBiWbLpb7iademyd' },
  { tokenId:322, name:'B2S Badge #322', trait:'Exploit Writer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbdB63dUfJ7bsqkyzwC4ryPQc6WUPz21tC3Q2uJXef5io' },
  { tokenId:323, name:'B2S Badge #323', trait:'Forensic Analyst', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWtQre2JKFhfCeNoZUtAW8zNVH7qWDXmSD3Sh61B8PpZD' },
  { tokenId:324, name:'B2S Badge #324', trait:'Dark Web Scout', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmenUNA3pn3ECqbPw3dVySu21AW94fBmBkSkAHdJP7dGqX' },
  { tokenId:325, name:'B2S Badge #325', trait:'Payload Crafter', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPjDGfX17cJ1Yqtj8UfxxAKPbRKPZCiAxSyysWPk3ZbxT' },
  { tokenId:326, name:'B2S Badge #326', trait:'APT Operator', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmULJk4PNQcrvKRKVDq3RQZfDowrhVFuzrRFfRxxKHVSKy' },
  { tokenId:327, name:'B2S Badge #327', trait:'Reverse Engineer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmeyXPxRSCskzy4v1Y1oUrodS96zvfi6oj13LcZUi7tLXq' },
  { tokenId:328, name:'B2S Badge #328', trait:'Fuzzer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXenTqFSFtmVT5LgxdjBef8zk87VaphZ5dzteYC6DSP1z' },
  { tokenId:329, name:'B2S Badge #329', trait:'Shellcoder', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWbk8NzTL4gXu3g42Kv4fWpptxGNe9v18ywN27cWnwZkf' },
  { tokenId:330, name:'B2S Badge #330', trait:'Network Sniffer', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTPHViW974ry2oUN8FCJ9KW2Ds4zM6vxBo1PJomnKyYMP' },
  { tokenId:331, name:'B2S Badge #331', trait:'Steganographer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVsRTpVbcr9YiNhSL7EGwwEDcxaRznW9aPNWocqga6xSY' },
  { tokenId:332, name:'B2S Badge #332', trait:'DeFi Hacker', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZMjstQmjhh9iNFq3Z27F4mEAtGkLBo1v9CHByWA289bZ' },
  { tokenId:333, name:'B2S Badge #333', trait:'Flash Loan Wizard', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQw9Y2L7PKaqk72jEkSBsQtES532vk9dbV7x2n2NoMfdo' },
  { tokenId:334, name:'B2S Badge #334', trait:'MEV Hunter', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmeposPa7Vwr4gk75X6aK2xwMehi4y7FcRQt4JAHpfXprr' },
  { tokenId:335, name:'B2S Badge #335', trait:'Smart Contract Auditor', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmYF3forrN7cjkhNxCCEPyFBHtFD4teurpMPhb7SRGxY1D' },
  { tokenId:336, name:'B2S Badge #336', trait:'Bridge Exploiter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmT1uahUpnm8hgGfuoUuGcTjpwyG2UbWmCamv68ENAWm4q' },
  { tokenId:337, name:'B2S Badge #337', trait:'Rug Detector', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXifSj8MaQpp2NYpmuLLQFWeeyde9d9jGNbcpi3dK32CF' },
  { tokenId:338, name:'B2S Badge #338', trait:'Whale Watcher', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmP1BFYPg6oYZXZEau4NkhKWaKjuNygqYsfwGi6msH5XWx' },
  { tokenId:339, name:'B2S Badge #339', trait:'Liquidity Sniper', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVKxGGCAhhYFF1NGaFP1NDDTGk4UPdc4X3gavJfGdhRh3' },
  { tokenId:340, name:'B2S Badge #340', trait:'On-Chain Analyst', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmNZrXWXtKCgjRqt9EHkN3iaCjSHLNwcZ76dbXq1dbrHUp' },
  { tokenId:341, name:'B2S Badge #341', trait:'Governance Voter', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmSL44aA5PF1LkxN1zA7UP63AojAGVbWbRY1f4cpwESQr2' },
  { tokenId:342, name:'B2S Badge #342', trait:'Yield Optimizer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXg1VJY62f3u2n8YBKV6pJAED9NM6xGaZ7qxRj5JsLBvt' },
  { tokenId:343, name:'B2S Badge #343', trait:'Cross-Chain Ranger', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTpDk6LtJ531JTCffeRrkADFc4SnghC4Ybn2LYvGv8FuF' },
  { tokenId:344, name:'B2S Badge #344', trait:'Blockchain Forensic', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbN3839KiYfpML3hs2fV3Gx2P8qLdR6TMWJH4ZNW7TH51' },
  { tokenId:345, name:'B2S Badge #345', trait:'Crypto OSINT', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbMrryMemGC6VVSDh5iSBkixjDb2VkjBeeYHjBdRT5AJW' },
  { tokenId:346, name:'B2S Badge #346', trait:'Web3 Red Team', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmSqS25h21PnkaySU5hKJtRcV4X9FgPRzKTfZgUpEioaRb' },
  { tokenId:347, name:'B2S Badge #347', trait:'DAO Infiltrator', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTW8b52eKFC7EovQ1pmg7cyWEwXEfU6QdkhXh3yjtr3QR' },
  { tokenId:348, name:'B2S Badge #348', trait:'Token Engineer', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmR6CB3tBkxEtGnXWp9UZqFg79YwgtLUY9DRqyCszLDtZ4' },
  { tokenId:349, name:'B2S Badge #349', trait:'ZK Prover', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZ1Uv3ahfrp2zssDLHHXwqy5CHkSU1URD2wNeho3GyS6P' },
  { tokenId:350, name:'B2S Badge #350', trait:'Sandwich Botter', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmcoS2WGjNfTiX6Uo21Anzp61ZSmSQyBL1LzwuxpWMF6Vs' },
  { tokenId:351, name:'B2S Badge #351', trait:'Mempool Watcher', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmNuCbvZKWgWNsbEMnwqeA7ATdqbhtkCX4nvzjM4DagZw3' },
  { tokenId:352, name:'B2S Badge #352', trait:'Social Engineer', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXF5J9HveChruQQ1DDyC3VvW8RPomQpzVudbN6wzAU38u' },
  { tokenId:353, name:'B2S Badge #353', trait:'Malware Dev', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTHvmbyxd3mA2YVtLoKbGK6r9vp15jSvjoYJJ3JgJsDUw' },
  { tokenId:354, name:'B2S Badge #354', trait:'Exploit Writer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZiNMqF6bo6vDq5bDbCSsVDD8NHM78NNwNaE5EAh5JLXp' },
  { tokenId:355, name:'B2S Badge #355', trait:'Forensic Analyst', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdH1poKCVWdobDxLcpJ5kS7jTEPQN8Cjkk8nMPPc3Ekvo' },
  { tokenId:356, name:'B2S Badge #356', trait:'Dark Web Scout', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRMPggVzwZhZ2SMyUEHdRddjoCYzezyo3EiJGQJrL3dDJ' },
  { tokenId:357, name:'B2S Badge #357', trait:'Payload Crafter', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQaJ2crWvsNaAtKuxgvgoKVAh5Krrr586eBBHxmWoXzsV' },
  { tokenId:358, name:'B2S Badge #358', trait:'APT Operator', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVdwhA2M2ZdeNfeYAxchLBoFCo5KPR1RAZX7tkRsmhi7H' },
  { tokenId:359, name:'B2S Badge #359', trait:'Reverse Engineer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmb1DMxJn17UqsZqzWSBabMjCJ6XwShN7BrE7tHfkNoUVF' },
  { tokenId:360, name:'B2S Badge #360', trait:'Fuzzer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmf6MEAJFWXHD19vfe92UaPKLszg51gVkZnKNTWDSWxwVs' },
  { tokenId:361, name:'B2S Badge #361', trait:'Shellcoder', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmW6uAaYRY4bVHpRmqntCCaZrgbYvYn6nEysSBgZwGcrf7' },
  { tokenId:362, name:'B2S Badge #362', trait:'Network Sniffer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmakvbBGRd23RGaBPaT32rSYqMzpMRrWLKb9MaKeiPWFF4' },
  { tokenId:363, name:'B2S Badge #363', trait:'Steganographer', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWrrFtYrNtcye8gh1xdyHPTKyRKfEnVonJ1XXmh1DR6Mq' },
  { tokenId:364, name:'B2S Badge #364', trait:'DeFi Hacker', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUEJn1E8r521DMgcGDjYXhboWWQ3dPyaFzyThoXkvsBBc' },
  { tokenId:365, name:'B2S Badge #365', trait:'Flash Loan Wizard', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVmzJvXKvKBCoCTEv16YoqTxhjYH8BUtARg5Hg2DVgpNX' },
  { tokenId:366, name:'B2S Badge #366', trait:'MEV Hunter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmU4aSdeLXXfzNTk4MxAuE4CwT5x24JGLCFcPX1ZmkDJG5' },
  { tokenId:367, name:'B2S Badge #367', trait:'Smart Contract Auditor', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdPkkH4b2CkPK76grVxXrj3qyipBa1VtzG8o8BzJAMEcP' },
  { tokenId:368, name:'B2S Badge #368', trait:'Bridge Exploiter', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmfWBUGpXoJARvUD7jqWU1NASKVejHyofQs7yZxoWoT96c' },
  { tokenId:369, name:'B2S Badge #369', trait:'Rug Detector', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUbBPorjVT4mYzBW235BgdeyFd9KN9edxkkT1fBjZZtYh' },
  { tokenId:370, name:'B2S Badge #370', trait:'Whale Watcher', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmaiyaquUbn9hm7BYKDiR4kHwJXB5NjDj9Bcz2PFScFme7' },
  { tokenId:371, name:'B2S Badge #371', trait:'Liquidity Sniper', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmY1kbe2c3Bhb3c3KtGUMcoEUjfSAJLbVvZxxFvgdnNGdN' },
  { tokenId:372, name:'B2S Badge #372', trait:'On-Chain Analyst', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmP55BnqHchy6aMGwFSaLjeWKPiAEW3NmYVGkPQ4Arkg7F' },
  { tokenId:373, name:'B2S Badge #373', trait:'Governance Voter', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qma8NiWsxKSZNVPi1wZAJHa7hrHWZ3q7e371dsiGnVHyri' },
  { tokenId:374, name:'B2S Badge #374', trait:'Yield Optimizer', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQxnw4FEkoy8d3WAntHhhFYdRnTeEUkgrgenRnEXrM7LT' },
  { tokenId:375, name:'B2S Badge #375', trait:'Cross-Chain Ranger', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZhB2YuEMH1usGYtkXf2AWZaujvkZd9bNyyqvZGbn2wdQ' },
  { tokenId:376, name:'B2S Badge #376', trait:'Blockchain Forensic', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZpfGsLf8u3ktPhQmX8XTaXtk8CVZSFrmUNm4eSkkPPAq' },
  { tokenId:377, name:'B2S Badge #377', trait:'Crypto OSINT', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbYsJ8xrZhrdN81bnguDuGgeyA4aJFukRnQXpcqbn2u2x' },
  { tokenId:378, name:'B2S Badge #378', trait:'Web3 Red Team', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbikZCsL7oWkksPq1jRiD5Ri7HgszPLjCashCSAdmmMb3' },
  { tokenId:379, name:'B2S Badge #379', trait:'DAO Infiltrator', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRRd4HbNn4CrspaF8cLFShkT6R1ZLFKyKzVP6v9CtcGhU' },
  { tokenId:380, name:'B2S Badge #380', trait:'Token Engineer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmaFJmmGiX89c2VgxSavEeLR5JwMfR3cJjpcW5xfLQddUG' },
  { tokenId:381, name:'B2S Badge #381', trait:'ZK Prover', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmSjkJZGvjMQKCr7jt2aA4Q44vYjmCTfyG8rM2QU1P3Azq' },
  { tokenId:382, name:'B2S Badge #382', trait:'Sandwich Botter', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmV5WGxHTZSuJtoF76GobdzNhbeDyekj4rZYuwgC5meWwn' },
  { tokenId:383, name:'B2S Badge #383', trait:'Mempool Watcher', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdhNEmWCowRuJz88tjJ8PNHovd7siYsDQDC9F8ScdmwA3' },
  { tokenId:384, name:'B2S Badge #384', trait:'Social Engineer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXFT7Fpc91Vnym9du1PVr3umEAAnNEu6RHJ91kfSDJUXP' },
  { tokenId:385, name:'B2S Badge #385', trait:'Malware Dev', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmSGenmKbrt5HD8tyc4LCsQnBZbwjm8MAKeFXTNxG6LgeU' },
  { tokenId:386, name:'B2S Badge #386', trait:'Exploit Writer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdZ6CkWWW7v5g3wtxz3BWqPA9yj767fwX7XU59PwmEp8i' },
  { tokenId:387, name:'B2S Badge #387', trait:'Forensic Analyst', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPer83TUSs5qQHTw9L91RsrK8gLAs4n1Aum5a3jJJJfbJ' },
  { tokenId:388, name:'B2S Badge #388', trait:'Dark Web Scout', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQdfpShjdwbyCPRAJSsn5EdwQJk2QodqNGw1wmVyGd75n' },
  { tokenId:389, name:'B2S Badge #389', trait:'Payload Crafter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmSedu7V9EJJuNDVVf2Hzw6ju9osmntURMS64pq3KK4YeJ' },
  { tokenId:390, name:'B2S Badge #390', trait:'APT Operator', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmP3KVg8yd4BPG1KJ6qcx1xkTxVPk4KJCXzgZaxTm6LNLd' },
  { tokenId:391, name:'B2S Badge #391', trait:'Reverse Engineer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRDurDyCC6HULz6BcR389Jjn2Mu44hEpkBR9JvjdubgAt' },
  { tokenId:392, name:'B2S Badge #392', trait:'Fuzzer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPmaSYvnQF23uLii4R8UW3anVDBJddEQaA9Mf2fiZ4TsX' },
  { tokenId:393, name:'B2S Badge #393', trait:'Shellcoder', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmW7gjXwDrgzdQUUdpLvrb8FvxC3zyEb5gfFdSuARJbHEx' },
  { tokenId:394, name:'B2S Badge #394', trait:'Network Sniffer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQUDEcCzo2hSf7gThY2ZxjiBhmBAhZaoDvhhYH2gwLCWu' },
  { tokenId:395, name:'B2S Badge #395', trait:'Steganographer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXwkAn1HzzjDzqTDEbJ8ZWToTSPXzgsmPs6Z6dnNjf5Rt' },
  { tokenId:396, name:'B2S Badge #396', trait:'DeFi Hacker', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmavnPRNTc4mn9qjiA5EzAkiywrL843gin27E874Q4tL8T' },
  { tokenId:397, name:'B2S Badge #397', trait:'Flash Loan Wizard', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPcAguYyxSTfWmyQWS9vpUVAkaJ5DR4rzctZUeRd4BeHq' },
  { tokenId:398, name:'B2S Badge #398', trait:'MEV Hunter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbzqHZuXacJVtuFUqamEjG7oCPAs4KTFCZKp3gsXM6mhA' },
  { tokenId:399, name:'B2S Badge #399', trait:'Smart Contract Auditor', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQgXxvx8hte56M54yq2hGq7WsKEx89RY3FUTguv7zxmmU' },
  { tokenId:400, name:'B2S Badge #400', trait:'Bridge Exploiter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbGNseQVRSRcp1iV9AXWCn4Yofv48J6EGWARUuhB9iVaE' },
  { tokenId:401, name:'B2S Badge #401', trait:'Rug Detector', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVc8mab8eRJuJ8n1H4FuVdLdzhEYQQDGYAhmDgLBh3bVp' },
  { tokenId:402, name:'B2S Badge #402', trait:'Whale Watcher', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmYHDLD44657G92YBNHe9bjF915HoyNW8Jxvpq2USVNRFW' },
  { tokenId:403, name:'B2S Badge #403', trait:'Liquidity Sniper', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmP7w4S55sdgEJXtUnXk63ZJqwzBMEZtEjjtH7LSrVpzNF' },
  { tokenId:404, name:'B2S Badge #404', trait:'On-Chain Analyst', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRaSdu4vay2nSG1YuFYSLDpSgfHHsJS1zPua4a2xztQdX' },
  { tokenId:405, name:'B2S Badge #405', trait:'Governance Voter', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmP8fQREz2jjGf3U3W5uGJDGsiWxCdhkdYFeScAjC7Xhik' },
  { tokenId:406, name:'B2S Badge #406', trait:'Yield Optimizer', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUqiyPWLDUaw8ADMVQaQGZQjELi9Ee9hbQnz7servT7xt' },
  { tokenId:407, name:'B2S Badge #407', trait:'Cross-Chain Ranger', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPA6WwH9bi96bhd9reStwgTaRb2joentNWVpWYf3a356Y' },
  { tokenId:408, name:'B2S Badge #408', trait:'Blockchain Forensic', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXDRRMaH2VtfGUponiacLXNektaJodN8UAPHXyju484mZ' },
  { tokenId:409, name:'B2S Badge #409', trait:'Crypto OSINT', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUhoTGRQpvFvAHDbjNodYBKeExkY1P3zF1yBs1j9UrADS' },
  { tokenId:410, name:'B2S Badge #410', trait:'Web3 Red Team', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdFXDTGQk8GArxrTtGUeptZCuLC483Ftm2NPKs5puJfwP' },
  { tokenId:411, name:'B2S Badge #411', trait:'DAO Infiltrator', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmb98vxvhT6ygiJkrYWDrPAX9aLdJt1KZ9zo2HUF8huoNf' },
  { tokenId:412, name:'B2S Badge #412', trait:'Token Engineer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPod2SZmvX6UF9TUPBwAJ5sCujSqwJaGJSZ3VJVFsTiEA' },
  { tokenId:413, name:'B2S Badge #413', trait:'ZK Prover', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmP2AmjGN4BUWurfEsDc1Sg1GTzpD2eCNWyGauhvcJgsiK' },
  { tokenId:414, name:'B2S Badge #414', trait:'Sandwich Botter', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmSQWRdGqTLXh9gaJaURidKvnnc1ZGKhuoLSuDQ3JxaBPR' },
  { tokenId:415, name:'B2S Badge #415', trait:'Mempool Watcher', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbY7x2oH83ai93gZC6ii64yW15Zgfb2AbyhYcjHSuPUGv' },
  { tokenId:416, name:'B2S Badge #416', trait:'Social Engineer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTXwDi3NNRGCaUDpw6ukNawbCZQKWi6a8mo1ppj7kMJ9s' },
  { tokenId:417, name:'B2S Badge #417', trait:'Malware Dev', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRnkGy5pxbnnkeDt6MJgxaPJXtvHzondFu6PSP3TEZ5uj' },
  { tokenId:418, name:'B2S Badge #418', trait:'Exploit Writer', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmetM2zJSj2ms9H9V6oH4BiBqGqSY6EjcU8ytXUZqLjfoP' },
  { tokenId:419, name:'B2S Badge #419', trait:'Forensic Analyst', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZvFzEWUY4YbNt5LAu2xbgSXUUByhepornfofYB3VuYDB' },
  { tokenId:420, name:'B2S Badge #420', trait:'Dark Web Scout', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWQWZfV7rPBaKrvJsJsG9j5bWs1fTZKFC25gYcAmkDvrM' },
  { tokenId:421, name:'B2S Badge #421', trait:'Payload Crafter', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdVuEqYxdLoLv4Bw8deEVDtrHjSk6gePw7BfcGUGVvLzY' },
  { tokenId:422, name:'B2S Badge #422', trait:'APT Operator', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRSADhyu7e1dFZPoLLBor55eZKQSCkt1QqNaiZs4i5gaT' },
  { tokenId:423, name:'B2S Badge #423', trait:'Reverse Engineer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdobFcgtovqFFa8NVQy43FnQmccum1cCb3hruq7tBUtH5' },
  { tokenId:424, name:'B2S Badge #424', trait:'Fuzzer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQ5HUz4Dw8LAqigRmh98zdrc5Yi96aV96DXPgiTQiyhAF' },
  { tokenId:425, name:'B2S Badge #425', trait:'Shellcoder', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXpmVDAQ8vFwKkLvJsZpb3iUj6yEutB1B2Jxp1ACS5FUP' },
  { tokenId:426, name:'B2S Badge #426', trait:'Network Sniffer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZR7qASUT7rry953efFGQrJmEoCw7JPXN8KqQmdrU5XMK' },
  { tokenId:427, name:'B2S Badge #427', trait:'Steganographer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZLjc36qii2wXfJsUs2Lctj6FsuCfgpvRU5UiRXB1zvc9' },
  { tokenId:428, name:'B2S Badge #428', trait:'DeFi Hacker', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmfRaJqgPUsfLmypVQbtbqiUyR15GHS2CKLbtTL2Cy6AZr' },
  { tokenId:429, name:'B2S Badge #429', trait:'Flash Loan Wizard', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmSioG6VSqqD9u2dyZDTtJpcXWdXamwoYuL8tNQ3EQfBQc' },
  { tokenId:430, name:'B2S Badge #430', trait:'MEV Hunter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbutEZnVJWqjmhZ3DzzLhEWuWtpfUTJ1zmNir6R5MpjJf' },
  { tokenId:431, name:'B2S Badge #431', trait:'Smart Contract Auditor', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmcnAEFDGDAKfUJC4LwseQmGwZBCpZc9DoDhKqfbU6myKW' },
  { tokenId:432, name:'B2S Badge #432', trait:'Bridge Exploiter', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZQfJn55T9iAWap1T4JpqzSnEXJaEeeTFna3vEjdnDED3' },
  { tokenId:433, name:'B2S Badge #433', trait:'Rug Detector', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmeWDQNePKvLHrCWt724dhUt6WLo1UPyeXnANwJUy2XMbs' },
  { tokenId:434, name:'B2S Badge #434', trait:'Whale Watcher', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmR4skuWDy7tYnQqYaErEHfMtsi3Cb5pkTj2onowXaeFXo' },
  { tokenId:435, name:'B2S Badge #435', trait:'Liquidity Sniper', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qma7sk7G6WA6PEYAWpm4DK7g46HkTThbbwCy5DVLx4F8mJ' },
  { tokenId:436, name:'B2S Badge #436', trait:'On-Chain Analyst', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmSr5E6Ke5ZzDKZHsNitTD6bd5sx5jbozdui5bTfKzzWZe' },
  { tokenId:437, name:'B2S Badge #437', trait:'Governance Voter', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXahRAJ9WFHv1V3nNZ2hAR5z9drymDXij6TrU8gyXH7Hx' },
  { tokenId:438, name:'B2S Badge #438', trait:'Yield Optimizer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWvzvQbb5CC12RuEzXDmQqfh2bytuG5Er1MscL5mHnzmg' },
  { tokenId:439, name:'B2S Badge #439', trait:'Cross-Chain Ranger', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRxZVsV5Zh5yX56f74GsQf3ssca74Kdzs9yMQcKM1hiNa' },
  { tokenId:440, name:'B2S Badge #440', trait:'Blockchain Forensic', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRYVEXt8ypiBwFjr9fCB4ZP5eCgNuhtcPDPMLd1BW8hH4' },
  { tokenId:441, name:'B2S Badge #441', trait:'Crypto OSINT', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdSr4ZydiLhAxkrG3BQRL3uzm8iYSmPfPUHajhDUm34hv' },
  { tokenId:442, name:'B2S Badge #442', trait:'Web3 Red Team', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQMUGqyHsfV9ntW5tUTKfTPZnaRahWxSbgKDZszmDMmtF' },
  { tokenId:443, name:'B2S Badge #443', trait:'DAO Infiltrator', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWFkfuUMPJSFuN5uaBQAyGQ8CSgsoGKUZcdNoYeYzqA48' },
  { tokenId:444, name:'B2S Badge #444', trait:'Token Engineer', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdwdHm1891Tbp7z4UukhCDunzkgomXq7peziqEibe7Vhw' },
  { tokenId:445, name:'B2S Badge #445', trait:'ZK Prover', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPHb7BkS1PEHH2HjLU8C1JUXT5SRoJveZ1hHxyPnL4nLq' },
  { tokenId:446, name:'B2S Badge #446', trait:'Sandwich Botter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmSKA11bsZSCVo6atnYMZpxn9t7aRHF9DctqXjXMh2D4cd' },
  { tokenId:447, name:'B2S Badge #447', trait:'Mempool Watcher', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmeKsbyQgWx8NUs9WVSacrzeAtXPf28jBBSN48m5StvErc' },
  { tokenId:448, name:'B2S Badge #448', trait:'Social Engineer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZHjFYhVQZZNRztM3q3qMzD4TRgZ6rfH4229gDjmeBWbb' },
  { tokenId:449, name:'B2S Badge #449', trait:'Malware Dev', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUK3bXqyVRRaR5i8piGmtjuiVY83nag4Uf7WGiT7ZSXvu' },
  { tokenId:450, name:'B2S Badge #450', trait:'Exploit Writer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTynMczWMjoSQqh45aowLEVjgxEjmTL63Ju4CzSrUJdZd' },
  { tokenId:451, name:'B2S Badge #451', trait:'Forensic Analyst', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQ4VXhyyEPmR6Up2tqRhznTMr8TTTr2bcWMw9UbroaVUc' },
  { tokenId:452, name:'B2S Badge #452', trait:'Dark Web Scout', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdAfMUBz9D267RofUxqeJG4pK9CBipzSKvn45QEYsg3rA' },
  { tokenId:453, name:'B2S Badge #453', trait:'Payload Crafter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPxn4SqcyXXjHDw5fxQ7EiTCSqC3L7XecT7oBfesbZUuW' },
  { tokenId:454, name:'B2S Badge #454', trait:'APT Operator', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmYQ5PejTz9szUzXeMRXkvy1huhLVowpKbHeKzWdTGDe5C' },
  { tokenId:455, name:'B2S Badge #455', trait:'Reverse Engineer', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qme9iVH9xfG5fpjk6Ebz5C8wgbQzLfxYiucSYYLcTkco76' },
  { tokenId:456, name:'B2S Badge #456', trait:'Fuzzer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmebuXTv6UpRXbUvP1F9XBLwYrA87DVR7sTUaRSXfsRAyU' },
  { tokenId:457, name:'B2S Badge #457', trait:'Shellcoder', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRqM9ebotsxEptxZV2wvS9Gd4ytJC18zai6nLCQpHbv1f' },
  { tokenId:458, name:'B2S Badge #458', trait:'Network Sniffer', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTnxEEQDKcsYCMCVuSyUW2NB1cmt3eWoDCRaSVE3RmoCp' },
  { tokenId:459, name:'B2S Badge #459', trait:'Steganographer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPubiGQzRogsbH56AF23uBhVsjn3N8uFGTNdopceJSKPD' },
  { tokenId:460, name:'B2S Badge #460', trait:'DeFi Hacker', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRria9krkw1zJEmpRqV1Lyg77rKUaXrcMGJpefHqxvawF' },
  { tokenId:461, name:'B2S Badge #461', trait:'Flash Loan Wizard', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmfY176Ahcf3SUmzekHCuyg7B3KGm1iHADPK7QGKFCwtLq' },
  { tokenId:462, name:'B2S Badge #462', trait:'MEV Hunter', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmV5VpoDgtQXkhc2SeaecfbSnAxNQMMThEb92jTaoDVTTr' },
  { tokenId:463, name:'B2S Badge #463', trait:'Smart Contract Auditor', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZwfSPGUDyXxY4VRPdqk8thu2LAjMe2AWFpaoDQ6zEbsP' },
  { tokenId:464, name:'B2S Badge #464', trait:'Bridge Exploiter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPnsnCXsmiQdP6zH9xt6MBz7ysxMGeRMDfKXwRMBgK4mV' },
  { tokenId:465, name:'B2S Badge #465', trait:'Rug Detector', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdNqDaWdGBAUNocVG3g4zB3tq6MLxdB8VS3Ah32nu5dBw' },
  { tokenId:466, name:'B2S Badge #466', trait:'Whale Watcher', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmaUdNXtdpHahX6T253B49VqemEhcP3DpKSw1rXKivBMNa' },
  { tokenId:467, name:'B2S Badge #467', trait:'Liquidity Sniper', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdNV9KKPGXmuAbZvde1FkGNSAUZYyi6LbwcEiUVtQftP9' },
  { tokenId:468, name:'B2S Badge #468', trait:'On-Chain Analyst', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUN2ixSJEzigQpyxtLu6ULJTnSZCn1H42RGsn1WbYUVxH' },
  { tokenId:469, name:'B2S Badge #469', trait:'Governance Voter', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRxdRogpHMM1sCuYZxJfaUH4W2NZBcA4HoZcx42j2boRP' },
  { tokenId:470, name:'B2S Badge #470', trait:'Yield Optimizer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmNSemNVKDwxJ7BBg3pfgojs5iw5jNhy4FT1ZZGgEw355r' },
  { tokenId:471, name:'B2S Badge #471', trait:'Cross-Chain Ranger', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRFgMFYRBiLGC88nqf4ijZMhqXsn4XPpgfzT2Mx3vXj6C' },
  { tokenId:472, name:'B2S Badge #472', trait:'Blockchain Forensic', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmSx6c4YLa3cna7CAU7gwqhRPjiarsWuwYjHz5cbGAF82P' },
  { tokenId:473, name:'B2S Badge #473', trait:'Crypto OSINT', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWPXx5LwTNwhMxbJmc8YbfEuTfibZYjZYFAKYUQsLeD7f' },
  { tokenId:474, name:'B2S Badge #474', trait:'Web3 Red Team', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTqu5E3HiZnpPLLMAF5U8SdQuD5NTosCN5uGCHad5X6pT' },
  { tokenId:475, name:'B2S Badge #475', trait:'DAO Infiltrator', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVbXopb631kGp5iTgxA2GCNxNUTWbMWa5bNyFMMYNdhJ9' },
  { tokenId:476, name:'B2S Badge #476', trait:'Token Engineer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmYyFf7fYL4EN2wsHZJ2e2h92sMKkQg9sS6sBWMmvyn118' },
  { tokenId:477, name:'B2S Badge #477', trait:'ZK Prover', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmP2qDJzVNQCXFr5oc57VieHSekpRfxfNyQhNW6Ajhn4hg' },
  { tokenId:478, name:'B2S Badge #478', trait:'Sandwich Botter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQMLJFeeg8tZt2f4PgmrjB7AdtLHGSW9WD2Krw7TWqrJj' },
  { tokenId:479, name:'B2S Badge #479', trait:'Mempool Watcher', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmapNM7KhSqT7oFbKrgFW7kpmnQN1L1jcd5G3PbjqyyY27' },
  { tokenId:480, name:'B2S Badge #480', trait:'Social Engineer', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmNmrGDKNHibrfsPz31urbcvE3cJTACumhDv7GXc1LnjDD' },
  { tokenId:481, name:'B2S Badge #481', trait:'Malware Dev', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmNNPE5RZtoU87To2K5s8cqqRe3Nj8oMnC8M5WFrPQMmnW' },
  { tokenId:482, name:'B2S Badge #482', trait:'Exploit Writer', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZhsC1N8JweXQVMW2UxFxVmfgcPE96hukxQhycJjgVeyg' },
  { tokenId:483, name:'B2S Badge #483', trait:'Forensic Analyst', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUdvSvJ2hddwSfpzQrVXyaGtCngaED96uToLbZyfw51LX' },
  { tokenId:484, name:'B2S Badge #484', trait:'Dark Web Scout', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPGPpGQBRZcpbzLRa52ii6aRRc1b7JmtB7UUr6hGUFEdy' },
  { tokenId:485, name:'B2S Badge #485', trait:'Payload Crafter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmf9wZB5rwHWGiLEUfiVEHyTUVNooG4N4VVHf5svnEGdcq' },
  { tokenId:486, name:'B2S Badge #486', trait:'APT Operator', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmW8BGpQeDdqcv6STCUpgG96tJmpKZUoM6Gg5tuUhKi5us' },
  { tokenId:487, name:'B2S Badge #487', trait:'Reverse Engineer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTb9tvAbMLTMM7gtBP8CwFcwiQLrVaqjQk3Ux3ZHnskpL' },
  { tokenId:488, name:'B2S Badge #488', trait:'Fuzzer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWcWuPKCJ1qJHyR2SyfQULXZ9gbBQHQRLXnFU5ehs9kte' },
  { tokenId:489, name:'B2S Badge #489', trait:'Shellcoder', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPs99mhUnYYheAAcxUNmjxMnwveQcWAKQr3c3z2Ai3fyY' },
  { tokenId:490, name:'B2S Badge #490', trait:'Network Sniffer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmaa3SDRogEDxevnYfEWGhfNLNe5yaVtyqcenmYWRXkwji' },
  { tokenId:491, name:'B2S Badge #491', trait:'Steganographer', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmNoq1Rt38f328Gp5VhgZ145MvzLN647Jd9RbzRcRZDPFF' },
  { tokenId:492, name:'B2S Badge #492', trait:'DeFi Hacker', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdUJB3tgRveUu8mDoWxmp23Pc9SwF8WxAo3VZKrotyuh6' },
  { tokenId:493, name:'B2S Badge #493', trait:'Flash Loan Wizard', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbzHoLE7wX5ozv5ArvnQsZWBJY3u72g6U9yTfsz25NVJp' },
  { tokenId:494, name:'B2S Badge #494', trait:'MEV Hunter', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmT6zwHsdE3iviAqWyZ8ZnQNn6DU8Ees3baZLRVkkiueqR' },
  { tokenId:495, name:'B2S Badge #495', trait:'Smart Contract Auditor', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmc8c4nvKUYeQD6xR92PQZedf5MJaXoewA86uBibStLf5B' },
  { tokenId:496, name:'B2S Badge #496', trait:'Bridge Exploiter', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdHeAdD8ZiRf2PCYd2Y7MEhqdQ2VRJNRwXmJRKtmjhEeD' },
  { tokenId:497, name:'B2S Badge #497', trait:'Rug Detector', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmfFDxeV5ykZqyeMDwkyuqfa88z3prWhqLZsqVvaFPD1pB' },
  { tokenId:498, name:'B2S Badge #498', trait:'Whale Watcher', rarity:'uncommon' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmd4kMwicQ97miUwArhtr7DbxMwSMjS5xxQ3GMLSPW17Zx' },
  { tokenId:499, name:'B2S Badge #499', trait:'Liquidity Sniper', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmcyxi1RByQw7a46PnZNarL91c5Uz9y4epMaqpHkv3R2WW' },
  { tokenId:500, name:'B2S Badge #500', trait:'On-Chain Analyst', rarity:'common' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmfZLCam1NgJbBfz8gLE6QgPq3uNiPHhbnKYfnLYfEWHso' },
  // SERIE GALACTIC #501-600 - ULTRA RARE
  { tokenId:501, name:'B2S Badge #501', trait:'Paper Hands Killer', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbQ6rt6KmGb74Ky7KP4hVGyrnGjiW6dX3mRMLY4kcErJV' },
  { tokenId:502, name:'B2S Badge #502', trait:'CT Alpha Caller', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmYwVaCL9dK8fK1nwxxioLaGSHfSijB5u87ndHSn7A9PvA' },
  { tokenId:503, name:'B2S Badge #503', trait:'Degen Yield Farmer', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmcKz4LTwb179igpbTEZzkGZgs5tacZcVyW2ka7ymmfm3S' },
  { tokenId:504, name:'B2S Badge #504', trait:'100x Degen', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXJRvCJLnSydSiBhoA9nWW81B6UKq7sgq4nBxYWJnciNf' },
  { tokenId:505, name:'B2S Badge #505', trait:'Rugged Survivor', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWcTvBE53uD1BTJRf3YTpgUNTn5erjD6rPDzjCPAA3VpQ' },
  { tokenId:506, name:'B2S Badge #506', trait:'Stack Maxi', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVaXVkNiahwbxU6gDeeefXhxoHYaLcaoLsPaSizZFWeob' },
  { tokenId:507, name:'B2S Badge #507', trait:'STX OG', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTTC2eZ3uUon2ATbF3QDjdQhPKXMV6UB2GkymqJiJ3HZQ' },
  { tokenId:508, name:'B2S Badge #508', trait:'Clarity Wizard', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUX5SX8E1L7FZqWANwPmm2KZEFSoX3uD6LugtadumRvgz' },
  { tokenId:509, name:'B2S Badge #509', trait:'Stacks Native', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbniJr4dGsp6M48X9e4hwsXzeAicZnnhoXBYVTw867mnB' },
  { tokenId:510, name:'B2S Badge #510', trait:'BTC L2 Builder', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTghNpfeim1wgwWgqjfsed8XYZ5TEHAce9jJtinpwxv4A' },
  { tokenId:511, name:'B2S Badge #511', trait:'sBTC Pioneer', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTQ7z9YDsGv3MSVSgLrSp2nncK1sD8xChdWNLTqfAp9rW' },
  { tokenId:512, name:'B2S Badge #512', trait:'Stack DeFi God', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQQ48conwTMsfTNUXAD9jvF9NUR3rFMf6iZ9KitVc3aGm' },
  { tokenId:513, name:'B2S Badge #513', trait:'Nakamoto Upgrade', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWTWsyAUqUvpbX6gqcHkF7cQBrTmuPmkoDV1KV5hw4kwb' },
  { tokenId:514, name:'B2S Badge #514', trait:'Interplanetary Node', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRL9UAHUsg3ySR5tpgaMQrw2TfWDDjGZuavfMpsJ9P5Qb' },
  { tokenId:515, name:'B2S Badge #515', trait:'Zero Gravity Staker', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTwv3sH5efdyEAHb9oDr6PbRNPCjRHq3ZCuf44YoszTXb' },
  { tokenId:516, name:'B2S Badge #516', trait:'Cosmic Bridge Runner', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWHYpRqvZ8VMEsm67Y5FJp5b26XiehsUPRQACJ5juzdC8' },
  { tokenId:517, name:'B2S Badge #517', trait:'Galaxy Brain Trader', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmeQddY8NRWcgTboAkjhrcgEkkLB3vfwoQ5Utkw1t2mS9z' },
  { tokenId:518, name:'B2S Badge #518', trait:'Multichain Astronaut', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmYwGSxeCxnUbBXKCkBvdtaCc99jAPPXFgLtMcNA1DzQX8' },
  { tokenId:519, name:'B2S Badge #519', trait:'DeFi Cosmonaut', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTJtoMHHtgDtwjTUBcZJpKzvMc8nWJYB9WTCjcve17E33' },
  { tokenId:520, name:'B2S Badge #520', trait:'Galactic Degen', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmYpgpaCM2Vev1mY4Veb8UWqzrRLUjhezxp9L5aLP3AS6P' },
  { tokenId:521, name:'B2S Badge #521', trait:'Cosmic Staker', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmaziNJEARQi9U2RMyVrJP7y28nzxSjfs4w2dv1e3LNKEq' },
  { tokenId:522, name:'B2S Badge #522', trait:'Nebula Farmer', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbcC6GN7P9b2QXYVFd5YC2a5mdgd9caVCQT3JE8oSRkYa' },
  { tokenId:523, name:'B2S Badge #523', trait:'Star Chain Surfer', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVvHrqGJsG7XzmcZCLNh5FetX7dkQHpJTcFLdr4ioQYPQ' },
  { tokenId:524, name:'B2S Badge #524', trait:'Void Trader', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWPRmuXwc3N1UcBWzKvRvJDf44SMKzJfJARUSQ2HNCq15' },
  { tokenId:525, name:'B2S Badge #525', trait:'Pulsar Validator', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmeCvcga847CAMj1F4XGYTQAvwTy4tbG7oKdtMQcXu9EBk' },
  { tokenId:526, name:'B2S Badge #526', trait:'Dark Matter Dev', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmSHekJe4ZoMCN6E4MMsGkE5UY8BUvGo9zHWYJN3bboj1e' },
  { tokenId:527, name:'B2S Badge #527', trait:'Quasar Flipper', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmT3RXu3P1DnmdeYFq9cCJ5j1z8ep8FiDjdUWiMcyfi1rX' },
  { tokenId:528, name:'B2S Badge #528', trait:'Supernova Yield', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPD6pLYzoV7e92tp3Ha7k2fmLCVQtUHiepk8E4Haa5iNu' },
  { tokenId:529, name:'B2S Badge #529', trait:'Black Hole Liquidity', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmerVXjEsincxPBZoBrLrZMzjQid3bp18hhg5TrorGv58a' },
  { tokenId:530, name:'B2S Badge #530', trait:'Base OG', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmS5dshQ6DYDSEjZrRR2mCarC29vJ84fAtqG98ythhqhxc' },
  { tokenId:531, name:'B2S Badge #531', trait:'Base Deployer', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmW6uTRxYBg4DNMKeWE2aCvEZdWyurruNznM9qFfPhtWHg' },
  { tokenId:532, name:'B2S Badge #532', trait:'Base Native', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmYx25cdjAZXV4toR1RfrJfWqaUDvDYyPsTAACiNfbv5kt' },
  { tokenId:533, name:'B2S Badge #533', trait:'L2 Pioneer', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRanjddfBJo17uquhJh8xnpzrKU6hdxjrLKqdqRpkiAfY' },
  { tokenId:534, name:'B2S Badge #534', trait:'Base Chain God', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPGtZ1VRsLQLbHE1WQ3FH7XdP1pDdb1u73rVTwoXaqfPw' },
  { tokenId:535, name:'B2S Badge #535', trait:'Onchain Summer', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmS7rzdBcAPE1gwv1TLZsuBs34N8YFJQfdNop4BdM8MGEi' },
  { tokenId:536, name:'B2S Badge #536', trait:'Base Maxi', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRUEWHM1FsGUgZSeNzRvHfumpwBVDhoozB3b6r1qcXBCH' },
  { tokenId:537, name:'B2S Badge #537', trait:'Coinbase Alumni', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbGC5ebEGQVE1Xjg7R59UYiYAbEBi7rU1k4C1iK45yS4x' },
  { tokenId:538, name:'B2S Badge #538', trait:'Full Degen', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPPJbKL28st5ZUZYS6NZ2dxWsNLa1kE24gwPAohxaYg5D' },
  { tokenId:539, name:'B2S Badge #539', trait:'Ape In', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmYj9EKrvpoNGSHEbykfLaQnhjYWiktr7moDLGPTvfWnUD' },
  { tokenId:540, name:'B2S Badge #540', trait:'Diamond Hands', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVBgif69V8JFuEy4tJKsYRhMABhQYq7kD7K9LhTQjLQ1A' },
  { tokenId:541, name:'B2S Badge #541', trait:'Paper Hands Killer', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUAnb55SJSHXP3S418bNJe6uVtT9mdXndvBXWhHDiSvkU' },
  { tokenId:542, name:'B2S Badge #542', trait:'CT Alpha Caller', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZV8aUW7PA1R9qhGV8dY22Azq9R9L6L2WPNbWx7QJays7' },
  { tokenId:543, name:'B2S Badge #543', trait:'Degen Yield Farmer', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRoFDgiE29ud5c58YntFDVufKdJ3rfwHaGtgorMFxau2T' },
  { tokenId:544, name:'B2S Badge #544', trait:'100x Degen', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPxzGG1eCUAJnXB5qa54ZqHTXhRz51streRVG3pi8ctLe' },
  { tokenId:545, name:'B2S Badge #545', trait:'Rugged Survivor', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRa9HwrA4hAM9C9uV9sVafFUNwQVezUdeDNsq5UWwt4Xi' },
  { tokenId:546, name:'B2S Badge #546', trait:'Stack Maxi', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQr5M7VLBdB3HQvtLTnSHbJpm5oMXoZboQzYGRcwPq3hf' },
  { tokenId:547, name:'B2S Badge #547', trait:'STX OG', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWi551kYHVGMxsPhtGRRf6DteuNxfXzTSiMHeDa41uzQL' },
  { tokenId:548, name:'B2S Badge #548', trait:'Clarity Wizard', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmP1aQjuu6FohVKKNhoqeXpyiuS5q4vcDkaZGDKQqZAyBM' },
  { tokenId:549, name:'B2S Badge #549', trait:'Stacks Native', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRgZNMMZFxE5owcsU5DiWcnVRM1z2vUeYrBW4Zv6vchwy' },
  { tokenId:550, name:'B2S Badge #550', trait:'BTC L2 Builder', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmNkXsTD3ijrm1ErGskJk4fWKvJVBxdsSboxnAixDcV7dP' },
  { tokenId:551, name:'B2S Badge #551', trait:'sBTC Pioneer', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbNy55T28Z6ksLazFE5ntrMu3ysdaJU3F3zYkTpUyq9Aw' },
  { tokenId:552, name:'B2S Badge #552', trait:'Stack DeFi God', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQ8rQ2daPR5a42BVSzrijFXXB1ERNPt3ASM7wgrNKfHy2' },
  { tokenId:553, name:'B2S Badge #553', trait:'Nakamoto Upgrade', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdQF9RFTrURgMbtD4XREjrhVuWc8Voi3iLC7fr5GQuQYS' },
  { tokenId:554, name:'B2S Badge #554', trait:'Interplanetary Node', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdyjpkdvqCxTmJnFQ3tfseE3Gc5CgpYUbRnW1fs1sNB9P' },
  { tokenId:555, name:'B2S Badge #555', trait:'Zero Gravity Staker', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVarLiQSzPvJvxwpnFSdmhvv1mEbiKiLowBmNfAfg3qoV' },
  { tokenId:556, name:'B2S Badge #556', trait:'Cosmic Bridge Runner', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmR7zPfmAZrBQTf6pYnnFdu9QWrmFP3rgRdoSb59YWwyP3' },
  { tokenId:557, name:'B2S Badge #557', trait:'Galaxy Brain Trader', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmV83QLZbE9n3rE8dTZLrMirrTg9wx7HFraAEyGNtGH52F' },
  { tokenId:558, name:'B2S Badge #558', trait:'Multichain Astronaut', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmagAz7LcCp2MCYT31R2F3We6utjJobJNbwgu2bSjS6YpB' },
  { tokenId:559, name:'B2S Badge #559', trait:'DeFi Cosmonaut', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qma5zzF4wywJA6Sjni7LX32F9219iHwxPw3i6696JbUyyg' },
  { tokenId:560, name:'B2S Badge #560', trait:'Galactic Degen', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRtJtnxAuyTyUwN1jzZhrJJxZnmYyj1srur1yKgh64jTa' },
  { tokenId:561, name:'B2S Badge #561', trait:'Cosmic Staker', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTajFpjZnH3zje9c1qZxTV7wQyZsg43YPdbKhXEAeJjCW' },
  { tokenId:562, name:'B2S Badge #562', trait:'Nebula Farmer', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmUTRkG559tCaV7krKUG7ECcHca5xNFcsgh6iJ67WyVhAQ' },
  { tokenId:563, name:'B2S Badge #563', trait:'Star Chain Surfer', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmSPdEXwLfLk6Y6pPK5b3egEznQwgfYmS4HPZ3GXzEH4Gk' },
  { tokenId:564, name:'B2S Badge #564', trait:'Void Trader', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQHTjRYfv5YLBapgYWs1SBTRbstvT2fyRLto81K6dHco2' },
  { tokenId:565, name:'B2S Badge #565', trait:'Pulsar Validator', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmbFa32hwPwEFrigpkx1dRWM9UBNn4PHYdDzfDc17CP9Qb' },
  { tokenId:566, name:'B2S Badge #566', trait:'Dark Matter Dev', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQEU7vDGK7JLayC8esm9shmpAapW563wF9JtJGAe6xrua' },
  { tokenId:567, name:'B2S Badge #567', trait:'Quasar Flipper', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdsFBE6FQt5USUacFnKbR95NADJPPo3g3siXHbvHbHEn4' },
  { tokenId:568, name:'B2S Badge #568', trait:'Supernova Yield', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdY7YXH6ztY3m1mqzCfU4b6yJwMcck4kGMgwhpW4fTabG' },
  { tokenId:569, name:'B2S Badge #569', trait:'Black Hole Liquidity', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmfCsF9K812r1UM7iPGY1juyWEL5ZZRTjDLP1kvhZA5Mn1' },
  { tokenId:570, name:'B2S Badge #570', trait:'Base OG', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXh6Q88sXEw5ZJ4K9zBpPC4bQiJXGDuzRyiR7t4eqy5tQ' },
  { tokenId:571, name:'B2S Badge #571', trait:'Base Deployer', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmP7daU4VL483VdcY7UNU4EeqpMXbWmhWR8BFfHv5ybULi' },
  { tokenId:572, name:'B2S Badge #572', trait:'Base Native', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZh8TgE3mNfcuLgVfxQycazosbHBB85QW52jEG6vX6NGw' },
  { tokenId:573, name:'B2S Badge #573', trait:'L2 Pioneer', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmNkWho9Uxtkw5pBaH4oP81SgTArsvPzXfnBcHAG8hvJi7' },
  { tokenId:574, name:'B2S Badge #574', trait:'Base Chain God', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXef4TdgKsp24YMPN4P49yWZ4x8Wdz7uoqBEh3vYcFLM9' },
  { tokenId:575, name:'B2S Badge #575', trait:'Onchain Summer', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTqViyCpunJqkv5csew9vucSzy6etaQzWceuGuGjqS476' },
  { tokenId:576, name:'B2S Badge #576', trait:'Base Maxi', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRC23ou7LDKTVwcU1LfH5ZePvSip7T23EBz9NLda4D8c5' },
  { tokenId:577, name:'B2S Badge #577', trait:'Coinbase Alumni', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXcKhWVtZimUQZX6xMur5iGAYkW8TFajpTH7NfBa7xFrp' },
  { tokenId:578, name:'B2S Badge #578', trait:'Full Degen', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmYe3FNoZTpgNt4uSQwpnqchE1JSE98SoruHQp3dwSciNg' },
  { tokenId:579, name:'B2S Badge #579', trait:'Ape In', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmR2Yuy9HUZorQPbw6sbgwQmHXDgXjpPzt2mTcVBCDB92q' },
  { tokenId:580, name:'B2S Badge #580', trait:'Diamond Hands', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmag2muoEcihythtirwdkiBpfrVR1ixx2KHPsmqBRXuvSB' },
  { tokenId:581, name:'B2S Badge #581', trait:'Paper Hands Killer', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmSLpmSAYPUnyPQhEbttgMBzRABnRuUoonE6UDhQTnEUjo' },
  { tokenId:582, name:'B2S Badge #582', trait:'CT Alpha Caller', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmXeLBPFfQKEbMjwwgsNy2erC5FGandHyXX9SiSB6s5d9Z' },
  { tokenId:583, name:'B2S Badge #583', trait:'Degen Yield Farmer', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmZ5jh8kYGwmo2oHa5Xz6rQwqA1JA8WCrHvgGm884uFTrJ' },
  { tokenId:584, name:'B2S Badge #584', trait:'100x Degen', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRA81SEU9qHSRQ87JTf2dvwy9pbKLybNEY8jz8XKEZeHY' },
  { tokenId:585, name:'B2S Badge #585', trait:'Rugged Survivor', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmWtuvH3ZTXxDdwiBNHDb5rsQeQcxC5puxshY6H34qPZ8D' },
  { tokenId:586, name:'B2S Badge #586', trait:'Stack Maxi', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmVZMHRKvYtcVNj4pSuR6WhAeyrwZX4KKnmA2assADefKt' },
  { tokenId:587, name:'B2S Badge #587', trait:'STX OG', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmetDP4rvPP6MiPH69tePP11ygMqFaKSQDDuibtRHhBmTR' },
  { tokenId:588, name:'B2S Badge #588', trait:'Clarity Wizard', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmU7Tjp6Fku34ThrhowfLdehhYfFkQ5LdhP5sFUcEL7tNY' },
  { tokenId:589, name:'B2S Badge #589', trait:'Stacks Native', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmTpTC3foY589ybRbjHRPUybj7HcH3cL6AZc5AQtxuEomw' },
  { tokenId:590, name:'B2S Badge #590', trait:'BTC L2 Builder', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmbvw2hZkSA6ChE5r4RvYYjaqik1SY1615nH3u5cnnUrAs' },
  { tokenId:591, name:'B2S Badge #591', trait:'sBTC Pioneer', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdMuYpg1b8tmfXuU1kgFRGbwhAytB7TvYguknnqGDKG5D' },
  { tokenId:592, name:'B2S Badge #592', trait:'Stack DeFi God', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmURWCiQh2sT2MsvNzwJuLK7akHDJihGbmMJ2cXG7dHjEd' },
  { tokenId:593, name:'B2S Badge #593', trait:'Nakamoto Upgrade', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/Qmd9aoMM1jWYQXi5LDK7MTwcThe49PofhjiyfUw4kJE5kx' },
  { tokenId:594, name:'B2S Badge #594', trait:'Interplanetary Node', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmRYe9oSm2HmYtD8juRzuTUinrtWozFGnDjNKQ7TRRDtFe' },
  { tokenId:595, name:'B2S Badge #595', trait:'Zero Gravity Staker', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmaaE1s4Up6LQ6fDEYbs9k9rL6joCS66LGXh9oDAKRRjM6' },
  { tokenId:596, name:'B2S Badge #596', trait:'Cosmic Bridge Runner', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmdtpHCZZ82snsUXurjWCpijNX3SL38rMeEgBJjQdrJRUY' },
  { tokenId:597, name:'B2S Badge #597', trait:'Galaxy Brain Trader', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmeMUE2DSytVCX1uX397onNRFPBW7kHqsp66kLxU7mLNRz' },
  { tokenId:598, name:'B2S Badge #598', trait:'Multichain Astronaut', rarity:'epic' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQXndELmnabWJpHPj6ko3cSaCoQBQVSQJgJ1veQ9BPHze' },
  { tokenId:599, name:'B2S Badge #599', trait:'DeFi Cosmonaut', rarity:'rare' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmPhJ6kJXvhVzCoEkFS6jqVwN3H9aVTpL7W5dpLccsb9tB' },
  { tokenId:600, name:'B2S Badge #600', trait:'Galactic Degen', rarity:'legendary' as const, imageUrl:'https://gateway.pinata.cloud/ipfs/QmQYmriJTkuiWw4YyCD2ey3djC4dioRoF4g4PYYQk8h1pf' },
];

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

const RARITY_COLOR: Record<Rarity, string> = {
  common:    'rgba(136,136,136,0.7)',
  uncommon:  '#00ff9f',
  rare:      '#00d4ff',
  epic:      '#ff00ff',
  legendary: '#ffd700',
}

const RARITY_BORDER: Record<Rarity, string> = {
  common:    'rgba(136,136,136,0.2)',
  uncommon:  'rgba(0,255,159,0.25)',
  rare:      'rgba(0,212,255,0.3)',
  epic:      'rgba(255,0,255,0.35)',
  legendary: 'rgba(255,215,0,0.5)',
}

const RARITY_ICON: Record<Rarity, string> = {
  common: '◆', uncommon: '◆◆', rare: '◆◆◆', epic: '★', legendary: '✦',
}

const SERIES: Record<string, { label: string; color: string }> = {
  infosec:  { label: 'INFOSEC',    color: '#00d4ff' },
  glitch:   { label: 'GLITCH_ART', color: '#ff00ff' },
  galactic: { label: 'GALACTIC',   color: '#ffd700' },
}

function getSeries(tokenId: number): keyof typeof SERIES {
  if (tokenId <= 170)  return 'infosec'
  if (tokenId <= 500)  return 'glitch'
  return 'galactic'
}

function NFTImage({ badge }: { badge: typeof IPFS_BADGES[0] }) {
  const [gatewayIndex, setGatewayIndex] = useState(0)
  const [loaded,       setLoaded]       = useState(false)
  const [failed,       setFailed]       = useState(false)
  const [retrying,     setRetrying]     = useState(false)
  const [timeoutId,    setTimeoutId]    = useState<ReturnType<typeof setTimeout> | null>(null)

  const cid = extractCid(badge.imageUrl)
  const src = getGatewayUrl(cid, gatewayIndex)

  useEffect(() => { return () => { if (timeoutId) clearTimeout(timeoutId) } }, [timeoutId])

  const handleError = useCallback(() => {
    const next = gatewayIndex + 1
    if (next < GATEWAYS.length) {
      setRetrying(true)
      const t = setTimeout(() => { setGatewayIndex(next); setRetrying(false) }, next * 800)
      setTimeoutId(t)
    } else { setFailed(true) }
  }, [gatewayIndex])

  if (failed) return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ fontSize: '20px', opacity: 0.2, marginBottom: '4px' }}>⬡</div>
      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', ...MONO }}>#{badge.tokenId}</div>
    </div>
  )

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#111' }}>
      {(!loaded || retrying) && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
      )}
      {!retrying && (
        <img
          src={src} alt={badge.name}
          loading="lazy" decoding="async"
          onLoad={() => setLoaded(true)}
          onError={handleError}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
        />
      )}
    </div>
  )
}

export default function NFTMarketplace() {
  const [filter,   setFilter]   = useState<Rarity | 'all' | keyof typeof SERIES>('all')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<typeof IPFS_BADGES[0] | null>(null)
  const [page,     setPage]     = useState(0)
  const PER_PAGE = 24

  const filtered = IPFS_BADGES.filter(b => {
    if (filter === 'infosec' || filter === 'glitch' || filter === 'galactic') {
      if (getSeries(b.tokenId) !== filter) return false
    } else if (filter !== 'all' && b.rarity !== filter) return false
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) &&
        !b.trait.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const pages     = Math.ceil(filtered.length / PER_PAGE)
  const displayed = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  const stats = {
    total:     IPFS_BADGES.length,
    legendary: IPFS_BADGES.filter(b => b.rarity === 'legendary').length,
    epic:      IPFS_BADGES.filter(b => b.rarity === 'epic').length,
    rare:      IPFS_BADGES.filter(b => b.rarity === 'rare').length,
  }

  const FILTER_TABS = [
    { key: 'all',      label: `ALL (${IPFS_BADGES.length})`, color: '#fff'     },
    { key: 'infosec',  label: 'INFOSEC #1-170',              color: '#00d4ff'  },
    { key: 'glitch',   label: 'GLITCH #201-500',             color: '#ff00ff'  },
    { key: 'galactic', label: 'GALACTIC #501-600',           color: '#ffd700'  },
    { key: 'legendary',label: `✦ LEGENDARY`,                 color: '#ffd700'  },
    { key: 'epic',     label: `★ EPIC`,                      color: '#ff00ff'  },
    { key: 'rare',     label: `◆◆◆ RARE`,                    color: '#00d4ff'  },
  ] as const

  return (
    <div style={{ ...MONO, color: '#fff' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#ff6600' }}>NFT_BADGE_MARKETPLACE</span>
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
          {stats.total} BADGES ON IPFS · 3 SERIES · SIP-009 STANDARD
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'TOTAL_BADGES', val: stats.total,     color: '#ff6600' },
          { label: 'LEGENDARY',    val: stats.legendary,  color: '#ffd700' },
          { label: 'EPIC',         val: stats.epic,       color: '#ff00ff' },
          { label: 'RARE',         val: stats.rare,       color: '#00d4ff' },
        ].map(s => (
          <div key={s.label} style={{ padding: '10px 12px', background: `${s.color}08`, border: `1px solid ${s.color}20`, borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: '8px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ marginBottom: '14px' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="SEARCH_BADGE_OR_TRAIT..."
          style={{ ...MONO, width: '100%', padding: '10px 14px', boxSizing: 'border-box', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px', outline: 'none', marginBottom: '10px' }}
          onFocus={e => e.target.style.borderColor = 'rgba(255,102,0,0.4)'}
          onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {FILTER_TABS.map(t => (
            <button key={t.key} onClick={() => { setFilter(t.key as any); setPage(0) }} style={{
              ...MONO,
              padding: '5px 12px', borderRadius: '20px', fontSize: '9px',
              fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer',
              border: filter === t.key ? `1px solid ${t.color}60` : '1px solid rgba(255,255,255,0.08)',
              background: filter === t.key ? `${t.color}12` : 'rgba(255,255,255,0.02)',
              color: filter === t.key ? t.color : 'rgba(255,255,255,0.35)',
              transition: 'all 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px', marginBottom: '16px' }}>
        {displayed.map(badge => {
          const rc    = RARITY_COLOR[badge.rarity]
          const rb    = RARITY_BORDER[badge.rarity]
          const serie = getSeries(badge.tokenId)
          return (
            <div
              key={badge.tokenId}
              onClick={() => setSelected(badge)}
              style={{
                background:   'rgba(255,255,255,0.02)',
                border:       `1px solid ${rb}`,
                borderRadius: '12px',
                overflow:     'hidden',
                cursor:       'pointer',
                transition:   'all 0.2s',
                position:     'relative',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = rc }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';    e.currentTarget.style.borderColor = rb }}
            >
              <div style={{ aspectRatio: '1', overflow: 'hidden', background: '#111' }}>
                <NFTImage badge={badge} />
              </div>
              {/* Rarity badge */}
              <div style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '10px', background: `${rc}20`, border: `1px solid ${rc}40`, color: rc }}>
                {RARITY_ICON[badge.rarity]}
              </div>
              {/* Series dot */}
              <div style={{ position: 'absolute', top: '6px', left: '6px', width: '6px', height: '6px', borderRadius: '50%', background: SERIES[serie].color, boxShadow: `0 0 6px ${SERIES[serie].color}` }} />
              <div style={{ padding: '6px 8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>#{badge.tokenId}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{badge.trait}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ ...MONO, padding: '7px 14px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, cursor: page === 0 ? 'not-allowed' : 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', opacity: page === 0 ? 0.3 : 1 }}>
            ← PREV
          </button>
          <span style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)' }}>
            {page + 1} / {pages} · {filtered.length} BADGES
          </span>
          <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1} style={{ ...MONO, padding: '7px 14px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, cursor: page === pages - 1 ? 'not-allowed' : 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', opacity: page === pages - 1 ? 0.3 : 1 }}>
            NEXT →
          </button>
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}
          onClick={() => setSelected(null)}>
          <div style={{ ...MONO, width: '100%', maxWidth: '340px', background: '#080b12', border: `1px solid ${RARITY_BORDER[selected.rarity]}`, borderRadius: '20px', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            {/* Top glow */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${RARITY_COLOR[selected.rarity]}, transparent)`, pointerEvents: 'none' }} />
            <div style={{ aspectRatio: '1', background: '#111' }}>
              <NFTImage badge={selected} />
            </div>
            <div style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{selected.name}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{selected.trait}</div>
                </div>
                <span style={{ fontSize: '9px', letterSpacing: '0.15em', padding: '3px 8px', borderRadius: '10px', background: `${RARITY_COLOR[selected.rarity]}15`, border: `1px solid ${RARITY_COLOR[selected.rarity]}35`, color: RARITY_COLOR[selected.rarity] }}>
                  {RARITY_ICON[selected.rarity]} {selected.rarity.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                {[
                  { label: 'TOKEN_ID', val: `#${selected.tokenId}` },
                  { label: 'SERIES',   val: SERIES[getSeries(selected.tokenId)].label },
                ].map(r => (
                  <div key={r.label} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '8px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>{r.label}</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{r.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={selected.imageUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: '10px', background: 'rgba(255,102,0,0.12)', border: '1px solid rgba(255,102,0,0.3)', color: '#ff6600', textDecoration: 'none', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', ...MONO }}>
                  VIEW_IPFS ↗
                </a>
                <button onClick={() => setSelected(null)} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', ...MONO }}>
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}