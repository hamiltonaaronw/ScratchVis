#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

float scale;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;
uniform float uTime;
uniform vec2 uRes;
uniform float[256] uSpectrum;

out vec4 retColor;

float sinc(float x)
{
	return sin(x) / x;
}

float cosc(float x)
{
	return cos(x) / x;
}

mat2 rot(float a)
{
	float c = cos(a);
	float s = sin(a);
	mat2 ret = mat2(
		c, s,
		-s, c
	);
	return ret;
}

vec3 hsv(float h, float s, float v)
{
	vec3 ret = ((clamp(abs(fract(h + vec3(0.0, 2.0, 1.0) / 3.0) * 6.0 - 3.0) - 1.0, 0.0, 1.0) - 1.0) * s + 1.0) * v;
	return ret;
}

//vec2 mainSound( in int samp, float time )
//{
    // A 440 Hz wave that attenuates quickly overt time
//    return vec2( sin(6.2831*440.0*time)*exp(-3.0*time) );
//}

uniform sampler2D backBuffer;

vec3 col(vec2 p)
{
	vec3 ret;
	vec3 c = vec3(0.0);

	float f1 = fract(uFreq * 10.0);
	float f2 = fract(uFreq * 100.0);

	float f = mod(max(f1, f2), min(f1, f2));
	f = fract(sinc(abs(f - uFreq)) * 10.0);
	float maxF = max(f, uFreq);
	float minF = min(f, uFreq);
	float ff = uFreq;

	float waves = 8.0;

	for (float i = 0; i < waves; i++)
	{
		vec2 q = p;

		q.x += i * 0.04 + ff  * 0.3;
		q.y += sin(q.x * 10. + uTime) * cos(q.x * 2.0) * ff * 0.2 * ((i + 1.0) / waves);
		float intensity = abs(0.1 / q.y) * clamp(ff, 0.35, 2.0);
		c += vec3(1.0 * intensity * (i / 5.0), 0.1 * intensity, 3.0 * intensity) * (3.0 / waves);
	}

	//c = vec3(1.0, 0.0, 0.0);
	//c = vec3(0.0, 1.0, 0.0);
	//c = vec3(0.0, 0.0, 1.0);

	ret = uFreq > 0.0001 ? c : vec3(0.0);

	return ret;
}


void main()
{
	//vec2 uv = gl_FragCoord.xy / uRes.xy / 2.0;
	vec2 uv = (gl_FragCoord.xy - 0.75 * uRes.xy) / uRes.y / 2.0;

	vec4 ret = vec4(col(uv), 1.0);

	retColor = ret;
}