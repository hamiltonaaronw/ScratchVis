#ifndef AUDIO_H
#define AUDIO_H

#include <../../FMOD/FMOD Studio API Windows/api/core/inc/fmod.h>
#include <../../FMOD/FMOD Studio API Windows/api/core/inc/fmod_errors.h>
#include <iostream>
#include <stdio.h>
#include <malloc.h>
#include <stdlib.h>
#include <filesystem>

#include <include/glm/glm/glm.hpp>
#include <sys/types.h>
#include <Windows.h>
#include <vector>
#include "../dirent.h"

struct Song
{
	FMOD_SOUND *mSound;
	std::string mSongName;
	int mOrigIndex;

	Song(std::string s, FMOD_SOUND *m, int i)
		:mSongName(s), 
		mSound(m),
		mOrigIndex(i)
	{}
};

class Audio
{
private:
	void FMODErrorCheck(FMOD_RESULT res);

	FMOD_SYSTEM					*mpSystem;
	FMOD_CHANNELGROUP			*mpCGroup;
	FMOD_CHANNEL				*mpChannel;
	FMOD_SOUND					*mpSong;
	std::vector<Song*>			mSongs;
	FMOD_SPEAKERMODE			mSpeakerMode;
	FMOD_DSP					*mpDSP;
	FMOD_SOUND					*mpStream;

	//static FMOD_RESULT F_CALLBACK callBack(FMOD_CHANNEL *pChannel, FMOD_CHANNELCONTROL_CALLBACK_TYPE type, unsigned int comanddata1, unsigned int commanddata2);

	unsigned int mVersion;
	int mNumDrivers;
	int mSongCount;
	char mDriverName;

	const int SPEC_SIZE = 256;
	float mFreq;
	float mSpectrum[256];

	int mCurSong;
	bool mIsPlaying;

	std::vector<int> mRandQueue;

	void genRandQueue();

	bool mIsRandom;

	std::string mMusicDir;

public:
	Audio(const char* path);
	Audio();
	void initAudio();
	void loadSong(const char* path);
	void loadSongs();
	void playSong(bool single);
	void unloadAudio();
	void update();
	void toggleSong(int prevNext);
	void selectSong(int i);

	float getFreq() { return mFreq; };
	float* getSpectrumData() { return mSpectrum; };
	int getNumSongs() { return mSongCount; };
	int getSpecSize() { return SPEC_SIZE; };

	void setIsPlaying(bool b) { mIsPlaying = b; };
	bool getIsPlaying() { return mIsPlaying; };

	void checkEndSong();

	void setIsRandom(bool b) { mIsRandom = b; };
	bool getIsRandom() { return mIsRandom; };
	void toggleRand();

	std::string getCurrentSongName() { return mSongs[mCurSong]->mSongName; };
	std::string getSongName(int i) { return mSongs[i]->mSongName; };

	void setMusicDir(std::string s) { mMusicDir = s; };
	std::string getMusicDir() { return mMusicDir; };
};

#endif
