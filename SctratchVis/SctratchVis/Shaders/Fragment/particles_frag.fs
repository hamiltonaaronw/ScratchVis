#version 410

precision mediump float;

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;

uniform float uTime;
uniform float uLastFrame;
uniform float uDeltaTime;

uniform float[256] uSpectrum;

uniform vec2 uRes;

out vec4 retColor;

float sinc(float x)
{
	float ret = sin(x) / x;
	return ret;
}

vec2 sinc(vec2 v)
{
	vec2 ret = vec2(sinc(v.x), sinc(v.y));
	return ret;
}

vec3 sinc(vec3 v)
{
	vec3 ret = vec3(sinc(v.x), sinc(v.y), sinc(v.z));
	return ret;
}

vec4 sinc(vec4 v)
{
	vec4 ret = vec4(sinc(v.x), sinc(v.y), sinc(v.z), sinc(v.w));
	return ret;
}

float cosc(float x)
{
	float ret = cos(x) / x;
	return ret;
}

vec2 cosc(vec2 v)
{
	vec2 ret = vec2(cosc(v.x), cosc(v.y));
	return ret;
}

vec3 cosc(vec3 v)
{
	vec3 ret = vec3(cosc(v.x), cosc(v.y), cosc(v.z));
	return ret;
}

vec4 cosc(vec4 v)
{
	vec4 ret = vec4(cosc(v.x), cosc(v.y), cosc(v.z), cosc(v.w));
	return ret;
}

vec3 wave(vec2 p)
{
	p -= 0.3;

	float sx = 0.3 * 1.9 * sin(4.0 * uFreq * (p.x - 3.0) - 6.0 * 0.5 * uTime)
					* sqrt((p.x + 0.3) * uTime * 0.6);
	float dy = 43.0 / (60.0 * abs(4.9 * p.y - sx - 1.0));

	vec3 ret = vec3((p.x + 0.05) * dy, 0.2 * dy, dy);

	return ret;
}

vec3 wave2(vec2 p)
{
	p -= 0.3;

	float sx = 0.3 * 1.9 * cos(4.0 * uFreq * (p.x - 3.0) - 6.0 * 0.5 * uTime)
					* sqrt((p.x + 0.3) * uTime * 0.6);
	float dy = 43.0 / (60.0 * abs(4.9 * p.y - sx - 1.0));

	vec3 ret = vec3((p.x + 0.05) * dy, 0.2 * dy, dy);

	return ret;
}

float genk1d(float x)
{
	float ret = fract(cos(x) * 43758.5453123);

	return ret;
}

float genk2d(vec2 v)
{
	float ret = genk1d(v.x + genk1d(v.y));

	return ret;
}

float genk3d(vec3 v)
{
	float ret = genk1d(v.x + genk1d(v.y + genk1d(v.z)));

	return ret;
}

float smoooth(vec3 p)
{
	vec3 u = fract(p);
	vec3 n = floor(p);

	u = u * u * (3.0 - 2.0 * u);

	float m0 = mix(genk3d(n), genk3d(n + vec3(1.0, 0.0, 0.0)), u.x);
	float m1 = mix(genk3d(n + vec3(0.0, 1.0, 0.0)), genk3d(n + vec3(1.0, 1.0, 0.0)), u.x);
	float m2 = mix(m0, m1, u.y);

	m0 = mix(genk3d(n + vec3(0.0, 0.0, 1.0)), genk3d(n + vec3(1.0, 0.0, 1.0)), u.x);
	m1 = mix(genk3d(n + vec3(0.0, 1.0, 1.0)), genk3d(n + vec3(1.0, 1.0, 1.0)), u.x);
	float m3 = mix(m0, m1, u.y);

	float ret = mix(m2, m3, u.z);

	return ret;
}

vec4 col(vec2 p)
{
	float ft = smoothstep(uFreq * uTime, uLastFreq, uDeltaFreq);
	//ft = sinc(ft);

	vec2 r = uRes +p;
	r.y/= 1.25;
	vec2 o = gl_FragCoord.xy - r + 1.5;
	o = vec2(length(o) / r.y - ft / 2.0, (o.y, o.x)) / 2.0 / 2.0;


	vec4 s = 0.2 * cos(1.6 * vec4(uTime / ft, 0.9 / ft, ft - 1.0, 0.7 * ft) + uTime + o.y + sin(o.y) * sin(ft) * 2.0);
	vec4 e = cosc(s.zwxy);
	vec4 f = ft / min(o.x - s, e - o.x);

	vec4 ret = dot(clamp(f * r.y * ft, 0.0, 1.0), 50.0 * (s - e) * ft) * (s - ft) - f;
	ret *= -smoooth(ret.xyz * uFreq);

	//ret += uSpectrum[int(floor(mod(uTime, 256.0)))] / 4.0;
	//ret /= uSpectrum[int(floor(mod(ft, 256)))];
	return ret;
}

void main()
{
	vec2 uv = gl_FragCoord.xy / uRes * oTexCoord;

	vec4 ret = col(uv);

	retColor = ret;
}