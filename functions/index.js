const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

// 유효성 검사 함수들
const containsKorean = (str) => /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(str);
const isValidEmail = (email) => email.includes("@");

// [1] 사용자 생성
exports.createUser = functions.https.onRequest(async (req, res) => {
  const { name, email } = req.body;
  if (containsKorean(name)) return res.status(400).send("❌ 이름에 한글이 포함되어 있어요.");
  if (!isValidEmail(email)) return res.status(400).send("❌ 이메일 형식이 아니에요.");

  const createdAt = new Date();
  await db.collection("users").add({ name, email, createdAt });
  res.send("✅ 사용자 등록 완료!");
});

// [2] 사용자 조회
exports.getUser = functions.https.onRequest(async (req, res) => {
  const name = req.query.name;
  const snapshot = await db.collection("users").where("name", "==", name).get();
  if (snapshot.empty) return res.status(404).send("❌ 사용자를 찾을 수 없습니다.");

  const user = snapshot.docs[0].data();
  res.send(user);
});

// [3] 이메일 수정
exports.updateUser = functions.https.onRequest(async (req, res) => {
  const { name, email } = req.body;
  if (!isValidEmail(email)) return res.status(400).send("❌ 이메일 형식이 아닙니다.");

  const snapshot = await db.collection("users").where("name", "==", name).get();
  if (snapshot.empty) return res.status(404).send("❌ 사용자를 찾을 수 없습니다.");

  const doc = snapshot.docs[0];
  await db.collection("users").doc(doc.id).update({ email });
  res.send("✅ 이메일 수정 완료!");
});

// [4] 사용자 삭제
exports.deleteUser = functions.https.onRequest(async (req, res) => {
  const name = req.query.name;
  const snapshot = await db.collection("users").where("name", "==", name).get();
  if (snapshot.empty) return res.status(404).send("❌ 사용자를 찾을 수 없습니다.");

  const doc = snapshot.docs[0];
  const user = doc.data();
  const now = new Date();
  const createdAt = user.createdAt.toDate();
  const seconds = (now - createdAt) / 1000;

  if (seconds < 60) return res.status(403).send("❌ 가입 후 1분이 지나야 삭제할 수 있어요.");
  await db.collection("users").doc(doc.id).delete();
  res.send("✅ 사용자 삭제 완료!");
});
