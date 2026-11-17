import { useState, useMemo } from 'react';

const MONEY_EMOJIS = ['💰', '💴', '💵', '💶', '💷'];

export default function App() {
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [totalPeople, setTotalPeople] = useState<string>('');
  const [lessPeople, setLessPeople] = useState<string>('');
  const [unit, setUnit] = useState<number>(100); // 丸め単位（100円単位 / 10円単位 / 1円単位）

  // 背景のランダムな絵文字配置を固定生成（再レンダリングでチラつかないようにuseMemoを使用）
  const backgroundEmojis = useMemo(() => {
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      emoji: MONEY_EMOJIS[Math.floor(Math.random() * MONEY_EMOJIS.length)],
      top: `${Math.floor(Math.random() * 95)}%`,
      left: `${Math.floor(Math.random() * 95)}%`,
      size: `${Math.floor(Math.random() * 20) + 20}px`,
      rotate: `${Math.floor(Math.random() * 360)}deg`,
      opacity: (Math.random() * 0.25 + 0.15).toFixed(2),
    }));
  }, []);

  // 計算ロジック
  const calculation = useMemo(() => {
    const amount = Number(totalAmount);
    const people = Number(totalPeople);
    const less = lessPeople === '' ? 0 : Number(lessPeople);

    if (!amount || amount <= 0 || !people || people <= 0 || less < 0 || less >= people) {
      return null;
    }

    const morePeople = people - less; // 多く払う人数

    // 全員で均等に割った基準額
    const basePerPerson = amount / people;

    if (less === 0) {
      // 少なく払う人がいない場合（通常の割り勘・端数は切り上げ等で調整）
      const standardPay = Math.ceil(basePerPerson / unit) * unit;
      const totalCollected = standardPay * people;
      const remainder = totalCollected - amount;
      return {
        mode: 'equal' as const,
        standardPay,
        people,
        totalCollected,
        remainder,
      };
    } else {
      // 幹事（少なく払う人）がいる場合：
      // 少なく払う人は基準額から切り捨て（または1単位少なく）、残りを他の人で割って切り上げ
      let lessPay = Math.floor(basePerPerson / unit) * unit;
      // もし完全に割り切れる場合でも「少なく払う」意図を反映させるため1単位引く（0円未満にはしない）
      if (lessPay * people === amount && lessPay >= unit) {
        lessPay -= unit;
      }

      const remainingAmount = amount - lessPay * less;
      const morePay = Math.ceil(remainingAmount / morePeople / unit) * unit;
      const totalCollected = lessPay * less + morePay * morePeople;
      const remainder = totalCollected - amount;

      return {
        mode: 'split' as const,
        lessPay,
        lessCount: less,
        morePay,
        moreCount: morePeople,
        totalCollected,
        remainder,
      };
    }
  }, [totalAmount, totalPeople, lessPeople, unit]);

  const handleReset = () => {
    setTotalAmount('');
    setTotalPeople('');
    setLessPeople('');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* 背景のランダムお金絵文字 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {backgroundEmojis.map((item) => (
          <span
            key={item.id}
            style={{
              position: 'absolute',
              top: item.top,
              left: item.left,
              fontSize: item.size,
              transform: `rotate(${item.rotate})`,
              opacity: item.opacity,
            }}
          >
            {item.emoji}
          </span>
        ))}
      </div>

      {/* メインカード */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 border border-orange-200">
        <div className="text-center mb-6">
          <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full mb-2">
            幹事さん応援ツール
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">
            💰 スマート割り勘計算
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            端数調整・傾斜配分もラクラク計算！
          </p>
        </div>

        {/* 入力フォーム */}
        <div className="space-y-4">
          {/* 合計金額 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              お会計の合計金額 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="例: 15800"
                className="w-full pl-4 pr-10 py-3 bg-orange-50/50 border-2 border-orange-200 rounded-xl text-lg font-bold text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                円
              </span>
            </div>
          </div>

          {/* 全体の人数 & 少なく払う人数 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                参加人数 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={totalPeople}
                  onChange={(e) => setTotalPeople(e.target.value)}
                  placeholder="例: 5"
                  className="w-full pl-3 pr-9 py-3 bg-orange-50/50 border-2 border-orange-200 rounded-xl text-lg font-bold text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                  人
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                少なく払う人
                <span className="text-[11px] font-normal text-gray-400 block sm:inline sm:ml-1">
                  (幹事など/任意)
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={lessPeople}
                  onChange={(e) => setLessPeople(e.target.value)}
                  placeholder="未入力可"
                  className="w-full pl-3 pr-9 py-3 bg-orange-50/50 border-2 border-orange-200 rounded-xl text-lg font-bold text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
                  人
                </span>
              </div>
            </div>
          </div>

          {/* 端数の丸め単位 */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">
              端数の計算単位
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '100円単位', val: 100 },
                { label: '10円単位', val: 10 },
                { label: '1円単位', val: 1 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setUnit(opt.val)}
                  className={`py-2 text-xs sm:text-sm font-bold rounded-lg border transition-all cursor-pointer ${
                    unit === opt.val
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-orange-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* エラーメッセージ（少なく払う人数 >= 全体人数 の場合） */}
        {Number(totalPeople) > 0 && Number(lessPeople) >= Number(totalPeople) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium text-center">
            ※「少なく払う人数」は「参加人数」より少なく設定してください。
          </div>
        )}

        {/* 計算結果表示エリア */}
        <div className="mt-6 pt-5 border-t border-dashed border-orange-200">
          {!calculation ? (
            <div className="bg-orange-50/70 rounded-2xl p-6 text-center text-gray-400 text-sm">
              金額と人数を入力すると<br />ここに支払い金額が表示されます
            </div>
          ) : (
            <div className="space-y-3">
              {calculation.mode === 'equal' ? (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-orange-700 bg-orange-200/70 px-2 py-0.5 rounded">
                      全員均等 ({calculation.people}人)
                    </span>
                    <p className="text-xs text-gray-500 mt-1">1人あたりの支払額</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-orange-600">
                      {calculation.standardPay.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-gray-700 ml-1">円</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* 多く払う人（一般メンバー） */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-xs font-bold text-white bg-orange-500 px-2.5 py-0.5 rounded-full">
                        多く払う人 ({calculation.moreCount}人)
                      </span>
                      <p className="text-xs text-gray-500 mt-1">1人あたりの支払額</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-orange-600">
                        {calculation.morePay.toLocaleString()}
                      </span>
                      <span className="text-sm font-bold text-gray-700 ml-1">円</span>
                    </div>
                  </div>

                  {/* 少なく払う人（幹事など） */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-700 bg-gray-200 px-2.5 py-0.5 rounded-full">
                        少なく払う人 ({calculation.lessCount}人)
                      </span>
                      <p className="text-xs text-gray-500 mt-1">幹事・遅刻など</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-gray-700">
                        {calculation.lessPay.toLocaleString()}
                      </span>
                      <span className="text-sm font-bold text-gray-600 ml-1">円</span>
                    </div>
                  </div>
                </>
              )}

              {/* 集金合計・お釣り（余り）の確認 */}
              <div className="flex justify-between items-center text-xs text-gray-500 px-2 pt-1">
                <span>集金合計: {calculation.totalCollected.toLocaleString()}円</span>
                <span className={calculation.remainder > 0 ? 'text-emerald-600 font-bold' : ''}>
                  余り（お釣り）: +{calculation.remainder.toLocaleString()}円
                </span>
              </div>
            </div>
          )}
        </div>

        {/* リセットボタン */}
        {(totalAmount || totalPeople || lessPeople) && (
          <button
            type="button"
            onClick={handleReset}
            className="w-full mt-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            入力をクリア
          </button>
        )}
      </div>
    </div>
  );
}