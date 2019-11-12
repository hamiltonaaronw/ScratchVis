#pragma once

#include "Audio/Audio.h"

//#include "../SDKs/FMOD/FMOD Studio API Windows/api/fsbank/inc/fsbank_errors.h"
//#include "../SDKs/FMOD/FMOD Studio API Windows/api/fsbank/inc/fsbank.h"
//#include "../SDKs/FMOD/FMOD Studio API Windows/api/studio/inc/fmod_studio.h"

enum class RecordingState
{
	REC_SELECTION,
	REC_RECORD,
	REC_PLAYBACK,
	REC_QUIT
};

class Recording : public Audio
{
private:

	RecordingState playback(FMOD::System* pSystem);
	RecordingState record(FMOD::System* pSystem);

	void clean();

public:
	Recording();
	~Recording();

	void update();
};
