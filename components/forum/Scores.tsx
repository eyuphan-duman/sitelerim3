'use client';

/** Logos puanları: profildeki seviye kartı, yan sütundaki haftanın birincileri ve liderlik tablosu */
import React, { useState } from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { Avatar, LevelBadge, VerifiedMark } from './ui';
import { isApprovedPsychologist, profileHref, useScores, useUsers, type ScoreBoard, type UserScore } from './social';

const MEDALS = ['#d9a441', '#9aa4b2', '#b87333'];

export function PointsRules({ rules }: { rules: ScoreBoard['rules'] }) {
  return (
    <ul className="fx-points-rules">
      <li><b>+{rules.post}</b> gönderi paylaşmak</li>
      <li><b>+{rules.reply}</b> yanıt yazmak</li>
      <li><b>+{rules.like}</b> gönderin ya da yanıtın beğenildikçe</li>
      <li><b>+{rules.repost}</b> gönderin ya da yanıtın yeniden paylaşıldıkça</li>
      <li><b>+{rules.replyReceived}</b> gönderine başkası yanıt yazdıkça</li>
    </ul>
  );
}

/** Profilde: seviye, ilerleme çubuğu ve istatistikler (yalnızca profil sahibine) */
export function LevelCard({ score }: { score?: UserScore }) {
  const board = useScores();
  const [open, setOpen] = useState(false);
  const s: UserScore = score || { points: 0, level: 1, progress: 0, posts: 0, replies: 0, likes: 0, reposts: 0, repliesReceived: 0, week: 0, month: 0 };
  const left = board.levelSize - s.progress;
  return (
    <section className="fx-levelcard" aria-label="Logos puanın">
      <div className="fx-levelcard-top">
        <div>
          <div className="fx-levelcard-title">Seviye {s.level}</div>
          <div className="fx-levelcard-sub">{s.points} puan · {left} puan sonra Seviye {s.level + 1}</div>
        </div>
        <LevelBadge level={s.level} points={s.points} />
      </div>
      <div className="fx-levelbar" role="progressbar" aria-valuemin={0} aria-valuemax={board.levelSize} aria-valuenow={s.progress}>
        <span style={{ width: `${(s.progress / board.levelSize) * 100}%` }} />
      </div>
      <div className="fx-levelstats">
        <div><b>{s.posts}</b><small>Gönderi</small></div>
        <div><b>{s.replies}</b><small>Yanıt</small></div>
        <div><b>{s.likes}</b><small>Aldığın beğeni</small></div>
        <div><b>{s.reposts}</b><small>Yeniden paylaşım</small></div>
        <div><b>{s.repliesReceived}</b><small>Aldığın yanıt</small></div>
        <div><b>{s.week}</b><small>Bu haftaki puan</small></div>
      </div>
      <button type="button" className="fx-text-btn" onClick={() => setOpen(v => !v)}>{open ? 'Gizle' : 'Puan nasıl kazanılır?'}</button>
      {open && (
        <>
          <PointsRules rules={board.rules} />
          <p className="fx-levelcard-note">Her {board.levelSize} puanda bir seviye atlarsın. Kendi içeriğine yaptığın etkileşimler ve isimsiz paylaşımlar puan kazandırmaz. Puanlar yaklaşık 30 dakikada bir güncellenir.</p>
        </>
      )}
    </section>
  );
}

/** Yan sütunda: haftanın ilk üçü */
export function WeeklyLeaders() {
  const board = useScores();
  const users = useUsers();
  const top = board.weekly.filter(x => users[x.uid]).slice(0, 3);
  if (!top.length) return null;
  return (
    <section className="fx-panel">
      <h2 className="fx-panel-title">Haftanın birincileri</h2>
      {top.map((x, i) => {
        const u = users[x.uid];
        return (
          <Link key={x.uid} href={profileHref(u)} className="fx-panel-row fx-leader-row">
            <span className="fx-leader-rank" style={{ background: MEDALS[i] }}>{i + 1}</span>
            <Avatar src={u.photoURL} name={u.displayName || u.username} size={36} />
            <span className="fx-leader-name">
              <b>{u.displayName || u.username}</b>
              <small>@{u.username}</small>
            </span>
            <span className="fx-leader-pts">{x.points} puan</span>
          </Link>
        );
      })}
      <Link href="/forum/liderler" className="fx-panel-more">Tüm sıralamayı gör</Link>
    </section>
  );
}

type Period = 'weekly' | 'monthly' | 'allTime';

/** Liderlik tablosu: haftanın, ayın ve tüm zamanların en çok puan toplayanları */
export function Leaderboard() {
  const board = useScores();
  const users = useUsers();
  const [period, setPeriod] = useState<Period>('weekly');
  const list = board[period].filter(x => users[x.uid]);
  const tabs: [Period, string][] = [['weekly', 'Bu hafta'], ['monthly', 'Bu ay'], ['allTime', 'Tüm zamanlar']];

  return (
    <div className="fx-leaderboard">
      <div className="fx-tabs fx-tabs-pill" role="tablist">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={period === k} className={`fx-tab ${period === k ? 'is-active' : ''}`} onClick={() => setPeriod(k)}>{label}</button>
        ))}
      </div>
      <p className="fx-leader-intro">
        {period === 'weekly' ? 'Bu hafta (pazartesiden beri) paylaşılan gönderi ve yanıtlardan toplanan puanlar.'
          : period === 'monthly' ? 'Bu ay paylaşılan gönderi ve yanıtlardan toplanan puanlar.'
          : 'Logos’a katıldığından beri toplanan tüm puanlar.'}
      </p>
      {!board.at ? <div className="fx-end">Yükleniyor…</div>
        : list.length === 0 ? <div className="fx-empty"><h2>Henüz sıralama yok</h2><p>Paylaşım yap, yanıt yaz; ilk sırada sen ol.</p></div>
        : list.map((x, i) => {
          const u = users[x.uid];
          const sc = board.users[x.uid];
          return (
            <Link key={x.uid} href={profileHref(u)} className={`fx-leader-item ${i < 3 ? 'is-top' : ''}`}>
              <span className="fx-leader-rank" style={i < 3 ? { background: MEDALS[i] } : undefined}>{i < 3 ? <Trophy size={14} /> : i + 1}</span>
              <Avatar src={u.photoURL} name={u.displayName || u.username} size={44} />
              <span className="fx-leader-name">
                <span className="fx-leader-line">
                  <b>{u.displayName || u.username}</b>
                  {isApprovedPsychologist(u) && <VerifiedMark iconOnly size={15} label={u.title} />}
                  <LevelBadge level={sc?.level} points={sc?.points} />
                </span>
                <small>@{u.username}</small>
              </span>
              <span className="fx-leader-pts"><b>{x.points}</b> puan</span>
            </Link>
          );
        })}
      <details className="fx-leader-rules">
        <summary>Puan nasıl kazanılır?</summary>
        <PointsRules rules={board.rules} />
        <p className="fx-levelcard-note">Her {board.levelSize} puanda bir seviye atlanır ve seviye rozeti isminin yanında görünür. Kendi içeriğine yapılan etkileşimler ve isimsiz paylaşımlar puan kazandırmaz. Banlı ya da dondurulmuş hesaplar sıralamada gösterilmez. Sıralama yaklaşık 30 dakikada bir güncellenir.</p>
      </details>
    </div>
  );
}
