// // src/services/api-football.ts
//
// // Lista VIP de Competições (Bomba Patch 100% Atualizado)
// // Inclui Ligas Nacionais, Copas, Supercopas e Continentais
// const IMPORTANT_LEAGUES = [
//     // --- BRASIL ---
//     71,  // Brasileirão Série A
//     72,  // Brasileirão Série B
//     73,  // Copa do Brasil
//
//     // --- CONTINENTAIS & MUNDIAL ---
//     13,  // Copa Libertadores
//     11,  // Copa Sul-Americana
//     2,   // UEFA Champions League
//     3,   // UEFA Europa League
//     15,  // Mundial de Clubes FIFA
//
//     // --- INGLATERRA ---
//     39,  // Premier League
//     45,  // FA Cup (Copa da Inglaterra)
//     48,  // EFL Cup (Copa da Liga Inglesa)
//     528, // Community Shield (Supercopa da Inglaterra)
//
//     // --- ESPANHA ---
//     140, // La Liga
//     143, // Copa del Rey
//     556, // Supercopa da Espanha (Aquela da sua imagem!)
//
//     // --- ITÁLIA ---
//     135, // Serie A
//     137, // Coppa Italia
//     547, // Supercoppa Italiana
//
//     // --- ALEMANHA ---
//     78,  // Bundesliga
//     81,  // DFB Pokal (Copa da Alemanha)
//     529, // DFL Supercup (Supercopa da Alemanha)
//
//     // --- FRANÇA ---
//     61,  // Ligue 1
//     66,  // Coupe de France
//     85,  // Trophée des Champions (Supercopa da França - Também na imagem!)
//
//     // --- SELEÇÕES (Para datas FIFA) ---
//     1,   // Copa do Mundo
//     9,   // Copa América
//     4,   // Eurocopa
//     10,  // Amistosos de Seleções
// ];
//
// // Suas credenciais (Rodízio de chaves para não falhar)
// const CREDENTIALS = [
//     {
//         key: '35af960ba8f9481ea31323d2947684cb',
//         host: 'v3.football.api-sports.io',
//         base: 'https://v3.football.api-sports.io',
//         header: 'x-apisports-key'
//     },
//     {
//         key: 'e365f274411341339a4e0ae25c9bd940',
//         host: 'v3.football.api-sports.io',
//         base: 'https://v3.football.api-sports.io',
//         header: 'x-apisports-key'
//     },
//     {
//         key: '35b416aa2cmshef614f5a1663962p1358dbjsn6c09b9cca566',
//         host: 'api-football-v1.p.rapidapi.com',
//         base: 'https://api-football-v1.p.rapidapi.com/v3',
//         header: 'x-rapidapi-key'
//     }
// ];
//
// export async function getMatchesFromApi(date: string) {
//     let lastError = null;
//
//     for (const cred of CREDENTIALS) {
//         try {
//             // Busca jogos da data específica
//             const url = `${cred.base}/fixtures?date=${date}&timezone=America/Sao_Paulo`;
//
//             console.log(`📡 Buscando jogos em: ${cred.host} para data ${date}`);
//
//             const res = await fetch(url, {
//                 method: 'GET',
//                 headers: {
//                     [cred.header]: cred.key,
//                     'x-rapidapi-host': cred.host
//                 },
//                 next: { revalidate: 0 } // Sem cache para pegar dados frescos
//             });
//
//             if (!res.ok) throw new Error(`Status ${res.status}`);
//
//             const data = await res.json();
//
//             // Verifica erros de cota ou chave inválida
//             if (data.errors && Object.keys(data.errors).length > 0) {
//                 console.warn(`⚠️ Erro na chave ${cred.host}:`, data.errors);
//                 lastError = data.errors;
//                 continue; // Tenta a próxima chave
//             }
//
//             const allMatches = data.response || [];
//
//             // 🔥 O FILTRO SOFASCORE: Só traz as ligas da nossa lista VIP
//             const filteredMatches = allMatches.filter((match: any) =>
//                 IMPORTANT_LEAGUES.includes(match.league.id)
//             );
//
//             console.log(`✅ Encontrados: ${allMatches.length} | Filtrados (VIP): ${filteredMatches.length}`);
//
//             // Retornamos apenas os dados essenciais limpos
//             return filteredMatches.map((m: any) => ({
//                 apiId: m.fixture.id,
//                 date: m.fixture.date,
//                 // Times
//                 homeTeam: m.teams.home.name,
//                 homeLogo: m.teams.home.logo,
//                 awayTeam: m.teams.away.name,
//                 awayLogo: m.teams.away.logo,
//                 // Liga
//                 leagueName: m.league.name,
//                 leagueLogo: m.league.logo,
//                 // Local
//                 location: m.fixture.venue.name || "Estádio",
//             }));
//
//         } catch (error) {
//             console.error(`❌ Falha na credencial ${cred.host}:`, error);
//             lastError = error;
//         }
//     }
//
//     console.error("❌ Todas as chaves de API falharam.");
//     throw new Error("Falha ao buscar jogos na API. Verifique as chaves.");
// }