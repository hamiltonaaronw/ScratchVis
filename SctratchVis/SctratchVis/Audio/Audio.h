#pragma once

#include <../../FMOD/FMOD Studio API Windows/api/core/inc/fmod.h>
#include <../../FMOD/FMOD Studio API Windows/api/core/inc/fmod.hpp>
#include <../../FMOD/FMOD Studio API Windows/api/core/inc/fmod_common.h>
#include <../../FMOD/FMOD Studio API Windows/api/core/inc/fmod_errors.h>
#include "../dirent.h"

#include <iostream>
#include <stdio.h>
#include <stdlib.h>
#include <random>
#include <sys/types.h>
#include <Windows.h>
#include <vector>
#include <time.h>

static const int MAX_DRIVERS = 16;
static const int MAX_DRIVERS_IN_VIEW = 3;

struct RECORD_STATE
{
	FMOD::Sound* sound;
	FMOD::Channel* channel;
};

struct Song
{
	FMOD::Sound *mSound;
	std::string mSongName;
	int mOrigIndex;

	Song(std::string s, FMOD::Sound *m, int i)
		:mSongName(s), 
		mSound(m),
		mOrigIndex(i)
	{}
};

class Audio
{
protected:
	void FMODErrorCheck(FMOD_RESULT res, std::string call);

private:
	// functions
	
	void genRandQueue();

	// variables
	bool mIsPaused;
	bool mIsRandom;

	FMOD::ChannelGroup			*mpCGroup;
	FMOD::Channel				*mpChannel;
	FMOD::DSP					*mpDSP;
	FMOD::System				*mpSystem;
	FMOD::Sound					*mpSound;

	std::vector<Song*>			mSongs;

	char mDriverName;
	int mNumDrivers;
	int mNumRecDrivers;
	int mSongCount;

	const int SPEC_SIZE = 256;
	int mCurSong;

	unsigned int mSamplesRecorded = 0;
	unsigned int mSamplesPlayed = 0;
	void* mExtraDriverData;
	int mNativeRate;
	int mNativeChannels;
	unsigned int mDriftThreshold;
	unsigned int mDesiredLatency;
	unsigned int mAdjustedLatency;
	int mActualLatency;
	FMOD_CREATESOUNDEXINFO mExinfo;
	unsigned int mSoundLength;
	RECORD_STATE record[MAX_DRIVERS] = {};
	int mNumConnectedDrivers;
	int mCursor;
	int mScroll;

	float mFreq;
	float mSpectrum[256];

	bool mIsPlaying;

	std::string mMusicDir;

public:

	// Constructor
	Audio();
	~Audio();

	// functions
	void checkEndSong();
	void initAudio();
	void loadSongs();
	void selectSong(int i);
	void toggleRand();
	void toggleSong(int prevNext);
	void unloadAudio();

	virtual void playSong();
	virtual void togglePause();
	virtual bool update();

	// getters/setters
	virtual float getFreq() { return mFreq; };
	virtual float* getSpectrumData() { return mSpectrum; };

	int getNumSongs() { return mSongCount; };
	int getSpecSize() { return SPEC_SIZE; };

	void setIsPlaying(bool b) { mIsPlaying = b; };
	bool getIsPlaying() { return mIsPlaying; };

	void setIsRandom(bool b) { mIsRandom = b; };
	bool getIsRandom() { return mIsRandom; };

	void setIsPaused(bool b) { mIsPaused = b; };
	bool getIsPaused() { return mIsPaused; };

	std::string getCurrentSongName() { return mSongs[mCurSong]->mSongName; };
	std::string getSongName(int i) { return mSongs[i]->mSongName; };

	void setMusicDir(std::string s) { mMusicDir = s; };
	std::string getMusicDir() { return mMusicDir; };
};

