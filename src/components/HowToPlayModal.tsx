/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HelpCircle, X, Keyboard, Smartphone, Zap, Shield, Bomb, Target } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-950/70 border border-blue-700/70 text-blue-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">조작법 & 게임 가이드</h2>
              <p className="text-xs text-slate-400">갤럭시 스트라이커 아케이드 비행 지침</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="mt-4 space-y-4 max-h-[65vh] overflow-y-auto pr-1 text-xs">
          {/* Controls PC & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5 text-sm">
                <Keyboard className="w-4 h-4 text-cyan-400" /> PC 키보드 & 마우스
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li><b className="text-cyan-300">방향키 / WASD</b>: 전투기 8방향 이동</li>
                <li><b className="text-cyan-300">Space / 마우스 좌클릭</b>: 무기 발사</li>
                <li><b className="text-rose-400">B 또는 X 키</b>: EMP 전역 폭탄 발동</li>
                <li><b className="text-slate-400">P 또는 ESC</b>: 게임 일시정지</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="font-bold text-white flex items-center gap-1.5 text-sm">
                <Smartphone className="w-4 h-4 text-amber-400" /> 모바일 & 태블릿
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li><b className="text-amber-300">화면 터치 & 드래그</b>: 손가락 위치로 비행</li>
                <li><b className="text-amber-300">자동 사격</b>: 기본 활성화 (버튼 토글 가능)</li>
                <li><b className="text-rose-400">우측 하단 EMP 버튼</b>: 위기 탈출 폭탄 투하</li>
              </ul>
            </div>
          </div>

          {/* Galaxian Classic Tactics */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5 text-sm">
              <Target className="w-4 h-4 text-emerald-400" /> 갤럭시 전술 핵심 노하우
            </div>
            <div className="space-y-1.5 text-slate-300 leading-relaxed">
              <p>
                🛸 <b>급강하 다이브 편대 주의</b>: 상단 매트릭스에서 편대를 이루던 외계 군단은
                특유의 곡선 궤적으로 급강하(Dive-bomb) 폭격을 감행합니다. 하단 모서리에 갇히지 않도록
                중앙 기동성을 확보하세요.
              </p>
              <p>
                🎯 <b>챌린징 스테이지 보너스</b>: 무비행 사격 타깃이 출현하는 보너스 스테이지에서는
                높은 명중률을 달성하면 거액의 추가 점수와 업적 훈장을 획득합니다.
              </p>
              <p>
                👾 <b>거대 모선 보스 공략</b>: 스테이지 3과 5의 외계 기함은 회전 방어막과 나선형 탄환을
                발사합니다. 집중 사격으로 외곽 무장을 먼저 무력화하세요.
              </p>
            </div>
          </div>

          {/* PowerUp items guide */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5 text-sm">
              <Zap className="w-4 h-4 text-purple-400" /> 전장 획득 아이템
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-cyan-900 text-cyan-200 font-bold">2x</span>
                <span>듀얼 펄스 캐논</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-amber-900 text-amber-200 font-bold">3W</span>
                <span>3방향 확산 산탄</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-purple-900 text-purple-200 font-bold">LZ</span>
                <span>고관통 고출력 레이저</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-200 font-bold">SH</span>
                <span>에너지 방어막 회복</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-rose-900 text-rose-200 font-bold">BM</span>
                <span>EMP 폭탄 추가</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-blue-900 text-blue-200 font-bold">DR</span>
                <span>동반 윙맨 지원 드론</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
          >
            확인 및 출격
          </button>
        </div>
      </div>
    </div>
  );
};
