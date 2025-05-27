fastfetch

quotes=(
  "The root of all evil is the root password. - Wise sage"
  "The root of suffering is attachment. - Siddhartha Gautama"
  "We are shaped by our thoughts; we become what we think. When the mind is pure, joy follows like a shadow that never leaves. - Siddhartha Gautama"
  "Nothing can harm you as much as your own thoughts unguarded. - Siddhartha Gautama"
  "Three things cannot be long hidden: the sun, the moon, and the truth. - Siddhartha Gautama"
  "You catch fish with both hands. - Vietnamese Proverb"
  "A hundred skills are not worth a well-practiced hand. - Vietnamese Proverb"
  "Remember that the storm is a good opportunity for the pine and the cypress to show their strength and their stability. - Hồ Chí Minh"
  "A revolution is not a dinner party, or writing an essay, or painting a picture, or doing embroidery; it cannot be so refined, so leisurely and gentle… - Mao Zedong"
  "Politics is war without bloodshed, while war is politics with bloodshed. - Mao Zedong"
  "Only by observing the laws of nature can mankind avoid costly blunders in its exploitation. Any harm we inflict on nature will eventually return to haunt us. - Xi Jinping"
  "Yellow cat or black cat, as long as it catches mice it is a good cat. - Comrade Liu Bocheng"
  "Are ye all ready? My soldiers brethren. If the day should soothly come. - 当那一天来临"
  "Cross the river by feeling for stones. - Deng Xiaoping"
  "Blowing out others' candles will not make yours brighter while blocking others' way will not take you further. - Xi Jinping"
  "Happiness does not fall out of the blue and dreams will not come true by themselves. We need to be down-to-earth and work hard. We should uphold the idea that working hard is the most honorable, noblest, greatest and most beautiful virtue. - Xi Jinping"
  "Keep a cool head and maintain a low profile. Never take the lead - but aim to do something big. - Deng Xiaoping"
  "Poverty is not socialism. To be rich is glorious. - Deng Xiaoping"
)

# Pick one at random and print it
print_quote() {
  # $RANDOM gives 0–32767; modulo the number of quotes
  local idx=$(( RANDOM % ${#quotes[@]} ))
  echo "\n\n${quotes[$idx]}\n"
}