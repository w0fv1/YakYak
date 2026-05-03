import type { BeforeInstallPromptEvent } from './browser'

export type PwaInstallResult = 'unavailable' | 'accepted' | 'dismissed'

export async function promptPwaInstall(
  promptEvent: BeforeInstallPromptEvent | undefined,
): Promise<PwaInstallResult> {
  if (!promptEvent) return 'unavailable'

  await promptEvent.prompt()
  const choice = await promptEvent.userChoice
  return choice.outcome
}
